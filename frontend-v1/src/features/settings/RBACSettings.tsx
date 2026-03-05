import React, { useState, useEffect } from 'react';
import { Shield, Users, UserPlus, Lock, Key, Eye, Clock, Trash2, Mail, Loader2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface OrgUser {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: 'owner' | 'admin' | 'analyst' | 'viewer';
    createdAt: string;
    lastLoginAt: string | null;
}

const ROLES = [
    { value: 'owner', label: 'Owner', desc: 'Full access to all settings, billing, and team management.', icon: Shield, color: '#f43f5e' },
    { value: 'admin', label: 'Admin', desc: 'Can manage users, upload data, and perform all analyses.', icon: Key, color: '#fbbf24' },
    { value: 'analyst', label: 'Analyst', desc: 'Can upload data, run analyses, and share reports. Cannot manage users.', icon: Users, color: '#38bdf8' },
    { value: 'viewer', label: 'Viewer', desc: 'Read-only access to published dashboards and reports.', icon: Eye, color: '#a78bfa' }
] as const;

export const RBACSettings: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Invite State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');
    const [inviting, setInviting] = useState(false);

    // Load Data
    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Handlers
    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            await api.put(`/users/${userId}/role`, { role: newRole });
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update role');
            loadUsers(); // Revert
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this user from the organization?')) return;
        try {
            setUsers(prev => prev.filter(u => u.id !== userId));
            await api.delete(`/users/${userId}`);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to remove user');
            loadUsers(); // Revert
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        try {
            setInviting(true);
            await api.post('/organization/invite', { email: inviteEmail, role: inviteRole });

            // Note: In a real app we might add them to an "invitations" list here,
            // but for simplicity we'll just show a success message
            setShowInviteModal(false);
            setInviteEmail('');
            alert(`Invitation sent to ${inviteEmail}`);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to send invite');
        } finally {
            setInviting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 opacity-50">
                <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                <div className="text-sm font-bold tracking-widest uppercase">Securing Connection...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-rose-500">
                <Lock size={48} className="mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    const canManageUsers = currentUser?.role === 'owner' || currentUser?.role === 'admin';

    return (
        <div className="flex flex-col gap-8 fade-in">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                        <Shield className="text-rose-500" />
                        Access Control
                    </h2>
                    <p className="text-secondary max-w-2xl">
                        Manage roles, granular permissions, and organizational access. Ensure compliance by strictly defining who can read, modify, or delete sensitive telemetry data.
                    </p>
                </div>
                {canManageUsers && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="btn btn-primary shadow-glow-primary hover-lift active-press"
                    >
                        <UserPlus size={16} className="mr-2" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Role Definitions Mini-Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {ROLES.map(role => {
                    const Icon = role.icon;
                    return (
                        <div key={role.value} className="card bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg" style={{ background: `${role.color}15`, color: role.color }}>
                                    <Icon size={16} />
                                </div>
                                <span className="font-bold text-sm tracking-widest uppercase" style={{ color: role.color }}>
                                    {role.label}
                                </span>
                            </div>
                            <p className="text-xs text-secondary leading-relaxed">
                                {role.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Active Users Table */}
            <div className="card overflow-hidden p-0 border border-[var(--border-default)]">
                <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Directory</h3>
                    <div className="text-xs font-bold text-secondary uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                        {users.length} Active Members
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#050505]">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary border-b border-[var(--border-subtle)]">User</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary border-b border-[var(--border-subtle)]">Role / Security Level</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary border-b border-[var(--border-subtle)]">Last Active</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary border-b border-[var(--border-subtle)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const isMe = user.id === currentUser?.id;
                            const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[3];
                            const RoleIcon = roleConfig.icon;

                            // Permission logic for the current row
                            const canEditThisUser = canManageUsers && !isMe &&
                                !(currentUser?.role === 'admin' && user.role === 'owner');

                            return (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors border-b border-[var(--border-subtle)] last:border-0 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm flex items-center gap-2">
                                                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Pending Name'}
                                                    {isMe && <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-black">You</span>}
                                                </div>
                                                <div className="text-xs text-secondary">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {canEditThisUser ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-primary transition-colors cursor-pointer"
                                                    style={{ width: '130px' }}
                                                >
                                                    {currentUser?.role !== 'owner' && <option disabled value="owner">Owner</option>}
                                                    {currentUser?.role === 'owner' && <option value="owner">Owner</option>}
                                                    <option value="admin">Admin</option>
                                                    <option value="analyst">Analyst</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] inline-flex" style={{ background: `${roleConfig.color}10` }}>
                                                <RoleIcon size={12} color={roleConfig.color} />
                                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: roleConfig.color }}>
                                                    {roleConfig.label}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Clock size={12} />
                                            <span className="text-xs font-medium">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {canEditThisUser && (
                                            <button
                                                onClick={() => handleRemoveUser(user.id)}
                                                className="p-2 rounded-lg border border-[var(--border-subtle)] text-secondary hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove Access"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="card w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Mail className="text-primary" /> Invite Colleague
                                </h3>
                                <button onClick={() => setShowInviteModal(false)} className="text-secondary hover:text-white p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleInvite} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold tracking-widest uppercase text-secondary">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="input bg-[var(--bg-surface)] w-full py-3"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold tracking-widest uppercase text-secondary">Initial Access Level</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { val: 'admin', icon: Key, color: '#fbbf24', desc: 'Can manage users & rules' },
                                            { val: 'analyst', icon: Users, color: '#38bdf8', desc: 'Can create & run analysis' },
                                            { val: 'viewer', icon: Eye, color: '#a78bfa', desc: 'Read-only dashboard view' }
                                        ].map(r => (
                                            <div
                                                key={r.val}
                                                onClick={() => setInviteRole(r.val as any)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${inviteRole === r.val ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'border-[var(--border-subtle)] hover:border-white/20'}`}
                                            >
                                                <div className={`p-2 rounded-lg`} style={{ background: `${r.color}20`, color: r.color }}>
                                                    <r.icon size={16} />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-bold text-sm capitalize">{r.val}</span>
                                                    <span className="text-xs text-secondary">{r.desc}</span>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${inviteRole === r.val ? 'border-primary' : 'border-secondary'}`}>
                                                    {inviteRole === r.val && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="btn bg-transparent border border-[var(--border-default)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviting || !inviteEmail}
                                        className="btn btn-primary"
                                    >
                                        {inviting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                        Send Invitation
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


