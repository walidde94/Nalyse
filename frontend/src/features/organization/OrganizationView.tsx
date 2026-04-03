import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Activity, Settings, Plus, LayoutGrid, CheckCircle2, XCircle, Search, Trash2, Key, Database, MoreVertical, ShieldAlert, Sparkles, Building2, Eye, Server, Loader2, ArrowRight, Clock } from 'lucide-react';
import { API_URL } from '../../config';

export const OrganizationView = ({ token }: { token?: string }) => {
    const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'audit' | 'branding'>('members');
    const [loading, setLoading] = useState(false);

    // Mock initial data structure to simulate fetching
    useEffect(() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1200);
    }, [activeTab]);

    const members = [
        { id: 1, name: 'Alice Chen', role: 'Super Admin', email: 'alice@quantum.ai', status: 'active', lastActive: 'Just now' },
        { id: 2, name: 'Bob Smith', role: 'Data Engineer', email: 'bob@quantum.ai', status: 'active', lastActive: '5m ago' },
        { id: 3, name: 'Charlie Lee', role: 'Analyst', email: 'charlie@quantum.ai', status: 'invited', lastActive: 'Never' },
        { id: 4, name: 'Diana Prince', role: 'Viewer', email: 'diana@quantum.ai', status: 'active', lastActive: '1hr ago' }
    ];

    const roles = [
        { id: 'r1', name: 'Super Admin', users: 1, permissions: ['all:system', 'users:manage', 'billing:manage'] },
        { id: 'r2', name: 'Data Engineer', users: 3, permissions: ['data:write', 'pipelines:manage', 'models:train'] },
        { id: 'r3', name: 'Analyst', users: 12, permissions: ['data:read', 'reports:create', 'dashboards:edit'] },
        { id: 'r4', name: 'Viewer', users: 45, permissions: ['dashboards:view', 'reports:export'] }
    ];

    const auditLogs = [
        { id: 'al1', user: 'Alice Chen', action: 'Modified RBAC Policy', resource: 'Role: Analyst', time: '10:45 AM', status: 'success' },
        { id: 'al2', user: 'System', action: 'Automated Backup', resource: 'PostgreSQL Prod', time: '09:00 AM', status: 'success' },
        { id: 'al3', user: 'Bob Smith', action: 'Failed Login Attempt', resource: 'User Login', time: '08:12 AM', status: 'failed' },
        { id: 'al4', user: 'Bob Smith', action: 'API Key Generated', resource: 'Service Keys', time: '08:05 AM', status: 'success' },
        { id: 'al5', user: 'Diana Prince', action: 'Exported Report', resource: 'Q4 Revenue Analysis', time: 'Yesterday', status: 'success' },
    ];

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)', minHeight: '100%', position: 'relative' }}>
            {/* Background Atmosphere */}
            <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.08), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '40vw', height: '40vh', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05), transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.03em' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(139, 92, 246, 0.5)' }}>
                            <Building2 size={22} color="#fff" />
                        </div>
                        Enterprise Organization
                    </h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontWeight: 500, marginLeft: '52px' }}>
                        Manage multi-tenancy, granular RBAC security policies, and monitor system audit logs.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                {[
                    { id: 'members', label: 'Identity Directory', icon: <Users size={16} /> },
                    { id: 'roles', label: 'Access Control (RBAC)', icon: <Shield size={16} /> },
                    { id: 'audit', label: 'Security Audit Log', icon: <Activity size={16} /> },
                    { id: 'branding', label: 'White-Label Engine', icon: <Sparkles size={16} /> },
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
                                background: isActive ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' : 'transparent',
                                border: `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease',
                                boxShadow: isActive ? '0 8px 16px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Container for Content */}
            <div style={{ position: 'relative', zIndex: 1, minHeight: '500px' }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                            <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
                            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Synchronizing Security Matrix...</span>
                        </motion.div>
                    ) : (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

                            {/* ─── DIRECTORY ──────────────────────────────────────────── */}
                            {activeTab === 'members' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                                <input type="text" placeholder="Search identities..." style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px 10px 36px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', width: '250px' }} />
                                            </div>
                                            <select style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}>
                                                <option>All Roles</option>
                                                {roles.map(r => <option key={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <button style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}>
                                            <Plus size={16} /> Add Identity
                                        </button>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                                                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Provision</th>
                                                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Active</th>
                                                    <th style={{ padding: '16px 24px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {members.map((m, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-white/5">
                                                        <td style={{ padding: '16px 24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${m.name.length * 50}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                                                                    {m.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{m.name}</div>
                                                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{m.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px 24px' }}>
                                                            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                                                                {m.role}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '16px 24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: m.status === 'active' ? '#10b981' : '#f59e0b' }}>
                                                                {m.status === 'active' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                                {m.status === 'active' ? 'Active' : 'Invited'}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{m.lastActive}</td>
                                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ─── RBAC ROLES ──────────────────────────────────────────── */}
                            {activeTab === 'roles' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {roles.map((r, i) => (
                                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                                {i === 0 && <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent)', filter: 'blur(20px)' }} />}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <Shield color={i === 0 ? '#8b5cf6' : '#94a3b8'} size={20} />
                                                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{r.name}</h3>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                                                        <Users size={12} /> {r.users}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Active Permissions</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {r.permissions.map(p => (
                                                        <span key={p} style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#a78bfa', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button style={{ background: 'transparent', border: 'none', color: '#8b5cf6', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        Edit Policy <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} className="hover:bg-white/5 transition-colors">
                                            <Plus size={32} style={{ marginBottom: '12px' }} />
                                            <span style={{ fontSize: '14px', fontWeight: 700 }}>Create Custom Role</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── SECURITY AUDIT LOG ────────────────────────────────── */}
                            {activeTab === 'audit' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ShieldAlert size={18} color="#3b82f6" /> System Audit Trail
                                        </h3>
                                        <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>Export CSV</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {auditLogs.map((log, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 2fr 1.5fr 100px 100px', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', gap: '16px' }}>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{log.time}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={12} /></div>
                                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{log.user}</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                                                    {log.action} <span style={{ opacity: 0.5 }}>on</span> <strong style={{ color: '#fff' }}>{log.resource}</strong>
                                                </div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: log.status === 'success' ? '#10b981' : '#ef4444', background: log.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>
                                                    {log.status}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>View JSON</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ─── WHITE LABEL BRANDING ──────────────────────────────── */}
                            {activeTab === 'branding' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Organization Identity</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Application Name</label>
                                                    <input type="text" defaultValue="Nalyse Enterprise" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Custom Domain</label>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>https://</span>
                                                        <input type="text" defaultValue="analytics.mycompany.com" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '0 8px 8px 0', color: '#fff', fontSize: '13px' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Theme Tokens</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#3b82f6', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Primary Brand</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>#3B82F6</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#8b5cf6', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Accent Color</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>#8B5CF6</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Surface Background</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>#0F172A</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button style={{ width: '100%', marginTop: '20px', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Generate CSS Overrides</button>
                                        </div>
                                    </div>

                                    <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1))', filter: 'blur(40px)', pointerEvents: 'none' }} />

                                        <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', width: '300px', height: '200px', borderRadius: '16px', position: 'relative', zIndex: 1, padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#3b82f6', borderRadius: '6px' }} />
                                                <div style={{ fontSize: '14px', fontWeight: 800 }}>Nalyse Enterprise</div>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px' }} />
                                            <div style={{ width: '70%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '24px' }} />
                                            <div style={{ marginTop: 'auto', background: '#3b82f6', color: '#fff', padding: '8px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 700 }}>
                                                Simulated Component
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative', zIndex: 1, marginTop: '32px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Live Preview Active</div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>All tenant-specific CSS variables injected</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
