import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Activity, Settings, Plus, CheckCircle2, XCircle, Search, MoreVertical, ShieldAlert, Sparkles, Building2, Loader2, ArrowRight, Clock, Database, Key, Server, Eye } from 'lucide-react';
import { API_URL } from '../../config';

export const OrganizationView = ({ token }: { token?: string }) => {
    const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'audit' | 'branding' | 'governance'>('members');
    const [loading, setLoading] = useState(true);
    const [orgData, setOrgData] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'roles') fetchRoles();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/organization`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.organization) {
                setOrgData(data.organization);
                setMembers(data.members || []);
            }
        } catch (err) {
            console.error('Failed to fetch org data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_URL}/api/organization/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRoles(data.roles || []);
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    };

    // Derived stats
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.isActive).length;

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)', minHeight: '100%', position: 'relative' }}>
            {/* Background Atmosphere */}
            <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.08), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.03em' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(139, 92, 246, 0.5)' }}>
                            <Building2 size={22} color="#fff" />
                        </div>
                        {orgData?.name || 'Enterprise Organization'}
                        <span style={{ fontSize: '14px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '4px 12px', borderRadius: '20px', color: '#a78bfa', fontWeight: 700, marginLeft: '8px' }}>
                            {activeMembers} Active
                        </span>
                    </h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontWeight: 500, marginLeft: '52px' }}>
                        Enterprise data governance, RBAC policies, and organizational analytics.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', position: 'relative', zIndex: 1, overflowX: 'auto', paddingBottom: '8px' }}>
                {[
                    { id: 'members', label: 'Identity Directory', icon: <Users size={16} /> },
                    { id: 'roles', label: 'Access Control', icon: <Shield size={16} /> },
                    { id: 'audit', label: 'Audit Log', icon: <Activity size={16} /> },
                    { id: 'analytics', label: 'Analytics', icon: <Server size={16} /> },
                    { id: 'lineage', label: 'Data Lineage', icon: <Database size={16} /> },
                    { id: 'governance', label: 'AI Governance', icon: <ShieldAlert size={16} /> },
                    { id: 'white-label', label: 'White-Label', icon: <Sparkles size={16} /> },
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px',
                                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: '1px solid',
                                borderColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div style={{ position: 'relative', zIndex: 1, minHeight: '500px' }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                            <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Synchronizing Governance Matrix...</span>
                        </motion.div>
                    ) : (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            
                            {activeTab === 'members' && (
                                <div style={{ background: 'rgba(20,20,20,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                                    <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', width: '300px' }}>
                                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                            <input type="text" placeholder="Search identities..." style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px 8px 36px', borderRadius: '8px', color: '#fff', fontSize: '13px', width: '100%' }} />
                                        </div>
                                        <button style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <Plus size={16} /> Add Identity
                                        </button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>User</th>
                                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Organization Role</th>
                                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Activity</th>
                                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Assets</th>
                                                <th style={{ padding: '16px 24px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.length > 0 ? members.map((m, i) => (
                                                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                                                                {m.firstName?.charAt(0) || m.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{m.displayName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email.split('@')[0]}</div>
                                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{m.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                                                            {m.orgRole?.name || m.role || 'Member'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: m.isActive ? '#10b981' : '#f59e0b' }}>
                                                            {m.isActive ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                            {m.isActive ? 'Active' : 'Pending'}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                                        {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : 'Never'}
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', gap: '12px', opacity: 0.6 }}>
                                                            <Activity size={14} /> <Database size={14} /> <Server size={14} />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: '64px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                                        <Users size={48} style={{ marginBottom: '16px', opacity: 0.1 }} />
                                                        <div>No identities detected in current organization segment.</div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'roles' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {roles.map(role => (
                                        <div key={role.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Shield size={20} color="#8b5cf6" />
                                                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{role.name}</h3>
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                                                    {role._count?.users || 0} users
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {role.permissions.map((p: string) => (
                                                    <span key={p} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                            <button style={{ width: '100%', marginTop: '24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                                                Edit Policy
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                        <Plus size={24} style={{ marginRight: '8px' }} />
                                        <span style={{ fontWeight: 700 }}>Custom Role</span>
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
