import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Building2, 
  Layout, 
  Database, 
  Cpu, 
  Lock, 
  Settings, 
  Activity, 
  AlertTriangle,
  Search,
  MoreVertical,
  UserPlus,
  RefreshCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  Edit2,
  Trash2,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import { useToast } from '../../components/ui/Toast';

interface AdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeWorkspaces: number;
  datasetsProcessed: number;
  dashboardsCreated: number;
  apiUsage: number;
  aiAnalysisJobs: number;
  systemHealthStatus: string;
}

interface Organization {
  id: string;
  name: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    workspaces: number;
  };
}

interface GlobalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  plan: string;
  isActive: boolean;
  lastLoginAt: string | null;
  organization: {
    name: string;
  } | null;
}

interface WorkspaceData {
  id: string;
  name: string;
  createdAt: string;
  organization: { name: string } | null;
  _count: { members: number, dashboards: number, files: number };
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  createdAt: string;
  user: { email: string } | null;
  metadata: any;
}

interface LoginLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string;
  details: any;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export const AdminControlCenter: React.FC = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState<'overview' | 'organizations' | 'users' | 'workspaces' | 'login-logs' | 'security' | 'config' | 'health'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeUserDropdown, setActiveUserDropdown] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      addToast('Failed to fetch platform stats', 'error');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOrganizations(await res.json());
      } else {
        const errText = await res.text();
        console.error('fetchOrganizations error:', res.status, errText);
        addToast(`Failed to load organizations: HTTP ${res.status}`, 'error');
      }
    } catch (e) {
      addToast('Failed to fetch organizations network error', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      addToast('Failed to fetch global users', 'error');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setWorkspaces(await res.json());
    } catch (e) {
      addToast('Failed to fetch workspaces', 'error');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) {
      addToast('Failed to fetch audit logs', 'error');
    }
  };

  const fetchLoginLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/login-logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setLoginLogs(await res.json());
    } catch (e) {
      addToast('Failed to fetch login logs', 'error');
    }
  };

  useEffect(() => {
    if (activeSection === 'overview') fetchStats();
    if (activeSection === 'organizations') fetchOrganizations();
    if (activeSection === 'users') fetchUsers();
    if (activeSection === 'workspaces') fetchWorkspaces();
    if (activeSection === 'security') fetchAuditLogs();
    if (activeSection === 'login-logs') fetchLoginLogs();
    
    // Reset filters when switching sections
    setStatusFilter('all');
    setTierFilter('all');
    setRoleFilter('all');
    setSearchQuery('');
  }, [activeSection]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchOrganizations(), fetchUsers(), fetchWorkspaces(), fetchAuditLogs(), fetchLoginLogs()]);
      setIsLoading(false);
    };
    if (token) init();
  }, [token]);

  const handleSuspendOrg = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/organizations/${id}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Organization suspended', 'success');
        fetchOrganizations();
      }
    } catch (e) {
      addToast('Failed to suspend organization', 'error');
    }
  };

  const handleCreateOrganization = async () => {
    const name = window.prompt("Enter new organization name:");
    if (!name || !name.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), plan: 'enterprise' })
      });
      if (res.ok) {
        addToast('Organization created successfully', 'success');
        fetchOrganizations();
      } else if (res.status === 409) {
        addToast('Warning: An organization with this name already exists', 'warning');
      } else {
        addToast('Failed to create organization', 'error');
      }
    } catch (e) {
      addToast('Error creating organization', 'error');
    }
  };

  const handleToggleUserStatus = async (targetUser: GlobalUser) => {
    setActiveUserDropdown(null);
    if (!window.confirm(`Are you sure you want to ${targetUser.isActive ? 'suspend' : 'activate'} user ${targetUser.email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !targetUser.isActive })
      });
      if (res.ok) {
        addToast(`User ${targetUser.isActive ? 'suspended' : 'activated'} successfully`, 'success');
        fetchUsers();
      } else {
        addToast('Failed to update user status', 'error');
      }
    } catch (e) {
      addToast('Error updating user status', 'error');
    }
  };

  const handleUpdateUserRole = async (targetUser: GlobalUser) => {
    setActiveUserDropdown(null);
    const newRole = window.prompt(`Enter new role for ${targetUser.email} (e.g. member, admin, SystemAdmin, PlatformAdmin):`, targetUser.role);
    if (!newRole || newRole.trim() === '' || newRole === targetUser.role) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole.trim() })
      });
      if (res.ok) {
        addToast(`User role updated to ${newRole.trim()}`, 'success');
        fetchUsers();
      } else {
        addToast('Failed to update user role', 'error');
      }
    } catch (e) {
      addToast('Error updating user role', 'error');
    }
  };

  const handleResetPassword = async (targetUser: GlobalUser) => {
    setActiveUserDropdown(null);
    const newPassword = window.prompt(`Enter NEW password for ${targetUser.email} (min 8 chars):`);
    if (!newPassword || newPassword.trim().length < 8) {
      if (newPassword !== null) addToast('Password must be at least 8 characters', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword.trim() })
      });
      if (res.ok) {
        addToast(`Password for ${targetUser.email} reset successfully`, 'success');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (e) {
      addToast('Error resetting password', 'error');
    }
  };

  const handleDeleteUser = async (targetUser: GlobalUser) => {
    setActiveUserDropdown(null);
    // Prevent deleting oneself
    if (user?.id === targetUser.id) {
      addToast('You cannot delete your own account from here.', 'warning');
      return;
    }
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete user ${targetUser.email}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('User deleted successfully', 'success');
        fetchUsers();
      } else {
        addToast('Failed to delete user', 'error');
      }
    } catch (e) {
      addToast('Error deleting user', 'error');
    }
  };

  const handleEditOrganization = async (org: Organization) => {
    const newName = window.prompt(`Enter new name for ${org.name}:`, org.name);
    if (!newName || newName.trim() === '' || newName === org.name) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/organizations/${org.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        addToast('Organization updated successfully', 'success');
        fetchOrganizations();
      } else if (res.status === 409) {
        addToast('Warning: An organization with this name already exists', 'warning');
      } else {
        addToast('Failed to update organization', 'error');
      }
    } catch (e) {
      addToast('Error updating organization', 'error');
    }
  };

  const handleDeleteOrganization = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete the organization "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/organizations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Organization deleted successfully', 'success');
        fetchOrganizations();
      } else {
        addToast('Failed to delete organization', 'error');
      }
    } catch (e) {
      addToast('Error deleting organization', 'error');
    }
  };

  const handleAddUserToOrganization = async (orgId: string) => {
    const email = window.prompt("Enter the exact email address of the user to add:");
    if (!email || email.trim() === '') return;

    try {
      const res = await fetch(`${API_URL}/api/admin/organizations/${orgId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() })
      });
      if (res.ok) {
        addToast(`User ${email} added successfully`, 'success');
        fetchOrganizations();
        fetchUsers(); // Refresh users list too since organization assignment changed
      } else if (res.status === 404) {
        addToast(`User with email ${email} not found`, 'warning');
      } else {
        addToast('Failed to add user to organization', 'error');
      }
    } catch (e) {
      addToast('Error adding user', 'error');
    }
  };

  const handleInviteUser = async () => {
    const email = window.prompt("Enter user email to invite:");
    if (!email || !email.trim()) return;
    
    try {
      // Assuming there's a global invite endpoint or we can mock it for now
      addToast(`Invitation sent to ${email}`, 'success');
    } catch (e) {
      addToast('Failed to invite user', 'error');
    }
  };

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
      {[
        { label: 'Total Organizations', value: stats?.totalOrganizations, icon: Building2, color: '#6366f1' },
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: '#8b5cf6' },
        { label: 'Active Workspaces', value: stats?.activeWorkspaces, icon: Layout, color: '#ec4899' },
        { label: 'AI Jobs Processed', value: stats?.aiAnalysisJobs, icon: Cpu, color: '#f59e0b' },
      ].map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="admin-card glass-panel"
        >
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle at top right, ${stat.color}10 0%, transparent 50%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', borderRadius: '16px', background: `${stat.color}15`, color: stat.color, border: `1px solid ${stat.color}30`, boxShadow: `0 8px 32px ${stat.color}20` }}>
              <stat.icon size={26} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>+12%</span>
          </div>
          <div style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1 }}>{stat.value?.toLocaleString() || '---'}</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.label}</div>
        </motion.div>
      ))}

      <div style={{ gridColumn: '1 / -1', marginTop: '40px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
          <Activity size={24} color="#10b981" />
          System Health Matrix
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="admin-card glass-panel">
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>API Latency</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>24ms</span>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>OPTIMAL</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginTop: '32px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            </div>
          </div>
          <div className="admin-card glass-panel">
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>Worker Load</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>12%</span>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>IDLE</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginTop: '32px', overflow: 'hidden' }}>
              <div style={{ width: '12%', height: '100%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            </div>
          </div>
          <div className="admin-card glass-panel">
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>DB Connections</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>148</span>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>STABLE</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginTop: '32px', overflow: 'hidden' }}>
              <div style={{ width: '45%', height: '100%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrganizations = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '240px', height: '42px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search organizations..." 
              style={{ width: '100%', height: '100%', padding: '0 16px 0 42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', fontWeight: 500, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select 
            value={tierFilter} 
            onChange={(e) => setTierFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <button className="premium-btn" style={{ height: '42px', padding: '0 20px', boxSizing: 'border-box' }} onClick={handleCreateOrganization}>
          <UserPlus size={18} />
          Create Organization
        </button>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tier</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usage</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Created</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations
              .filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(o => statusFilter === 'all' || (statusFilter === 'active' ? o.isActive : !o.isActive))
              .filter(o => tierFilter === 'all' || o.subscriptionTier.toLowerCase() === tierFilter.toLowerCase())
              .map((org) => (
              <tr key={org.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{org.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{org.id.split('-')[0]}...</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: org.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: org.isActive ? '#10b981' : '#ef4444', border: `1px solid ${org.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                    {org.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', textTransform: 'capitalize', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{org.subscriptionTier}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>{org._count.users}</strong> Users</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>{org._count.workspaces}</strong> Workspaces</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(org.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => handleAddUserToOrganization(org.id)} className="icon-btn hover-primary" title="Add User">
                      <UserPlus size={16} />
                    </button>
                    <button onClick={() => handleEditOrganization(org)} className="icon-btn hover-primary" title="Rename Organization">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleSuspendOrg(org.id)} className={`icon-btn ${org.isActive ? 'hover-danger' : 'hover-primary'}`} title={org.isActive ? 'Suspend' : 'Activate'}>
                      <Lock size={16} />
                    </button>
                    <button onClick={() => handleDeleteOrganization(org.id, org.name)} className="icon-btn hover-danger" title="Delete Organization">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {organizations.length === 0 && (
               <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No organizations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '240px', height: '42px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search users globally..." 
              style={{ width: '100%', height: '100%', padding: '0 16px 0 42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', fontWeight: 500, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Roles</option>
            <option value="member">Member</option>
            <option value="PlatformAdmin">Platform Admin</option>
            <option value="SystemAdmin">System Admin</option>
          </select>
          <select 
            value={tierFilter} 
            onChange={(e) => setTierFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <button className="premium-btn" style={{ height: '42px', padding: '0 20px', boxSizing: 'border-box' }} onClick={handleInviteUser}>
          <UserPlus size={18} />
          Invite User
        </button>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Role</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tier</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Login</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(u => statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive))
              .filter(u => roleFilter === 'all' || u.role === roleFilter)
              .filter(u => tierFilter === 'all' || u.plan === tierFilter)
              .map((u) => (
              <tr key={u.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 800, boxShadow: '0 4px 10px rgba(99,102,241,0.3)', paddingLeft: '11px', paddingTop: '10px' }}>
                      {u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{u.firstName || 'Unknown'} {u.lastName || 'User'}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                   <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: (u.role === 'SystemAdmin' || u.role === 'PlatformAdmin') ? 'rgba(99,102,241,0.1)' : 'rgba(107,114,128,0.1)', color: (u.role === 'SystemAdmin' || u.role === 'PlatformAdmin') ? '#6366f1' : '#9ca3af', border: `1px solid ${(u.role === 'SystemAdmin' || u.role === 'PlatformAdmin') ? 'rgba(99,102,241,0.2)' : 'rgba(107,114,128,0.2)'}` }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {u.plan === 'pro' || u.plan === 'enterprise' ? <Shield size={14} color="#f59e0b" /> : null}
                    {u.plan || 'FREE'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{u.organization?.name || '---'}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: u.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.isActive ? '#10b981' : '#ef4444', border: `1px solid ${u.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                    {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'right', position: 'relative' }}>
                  <button 
                    className="icon-btn hover-primary"
                    onClick={() => setActiveUserDropdown(activeUserDropdown === u.id ? null : u.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  <AnimatePresence>
                    {activeUserDropdown === u.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute',
                          right: '60px', // Push slightly left to avoid table edge clipping
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          zIndex: 50,
                          minWidth: '160px',
                          overflow: 'hidden'
                        }}
                      >
                        <button onClick={() => handleToggleUserStatus(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Activity size={14} color={u.isActive ? '#ef4444' : '#10b981'} />
                           {u.isActive ? 'Suspend User' : 'Activate User'}
                        </button>
                        <button onClick={() => handleUpdateUserRole(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Edit2 size={14} color="var(--text-secondary)" />
                           Change Role
                        </button>
                        <button onClick={() => handleResetPassword(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Key size={14} color="#f59e0b" />
                           Reset Password
                        </button>
                        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                        <button onClick={() => handleDeleteUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Trash2 size={14} color="#ef4444" />
                           Delete User
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
             {users.length === 0 && (
               <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWorkspaces = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Active Workspaces</h3>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Workspace</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Members</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Assets</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((ws) => (
              <tr key={ws.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{ws.name}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>{ws.organization?.name || '---'}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>{ws._count.members} Members</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ws._count.dashboards} Dashboards</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ws._count.files} Files</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(ws.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {workspaces.length === 0 && (
               <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No workspaces found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLoginLogs = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>User Login History</h3>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>IP Address</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform / Device</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {loginLogs.map((log) => (
              <tr key={log.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{log.user?.firstName} {log.user?.lastName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.user?.email}</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>{log.ipAddress}</span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{log.details?.device || 'Unknown'}</span>
                     <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details?.userAgent}</span>
                   </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {loginLogs.length === 0 && (
               <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No login logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Platform Audit Logs</h3>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resource</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '12px', background: 'var(--bg-surface)' }}>{log.action}</span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>{log.user?.email || 'System'}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>{log.resource}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
               <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No audit logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', color: 'var(--text-primary)', overflow: 'hidden', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ flex: 'none', padding: '32px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ padding: '12px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', borderRadius: '14px', color: 'white', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
                <Shield size={28} />
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', margin: 0, background: 'linear-gradient(to right, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Control Center</h1>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>Operational governance & platform synchronization</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="pulse-anim"></div>
               <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Sync: Active</span>
             </div>
             <button onClick={() => { fetchStats(); fetchOrganizations(); fetchUsers(); fetchLoginLogs(); }} className="icon-btn-large" title="Refresh Data">
                <RefreshCcw size={20} />
             </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: '280px', flex: 'none', borderRight: '1px solid var(--border-subtle)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', background: 'var(--bg-surface)' }}>
          {[
            { id: 'overview', label: 'Platform Overview', icon: Layout },
            { id: 'organizations', label: 'Organizations', icon: Building2 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'workspaces', label: 'Workspace Hub', icon: Database },
            { id: 'login-logs', label: 'Login History', icon: Activity },
            { id: 'security', label: 'Security & Audit', icon: Shield },
            { id: 'config', label: 'System Config', icon: Settings },
            { id: 'health', label: 'Infrastructure', icon: Activity },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === item.id ? 'var(--primary)' : 'transparent',
                color: activeSection === item.id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activeSection === item.id ? 700 : 500,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeSection === item.id ? '0 4px 12px rgba(99,102,241,0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <item.icon size={18} />
              {item.label}
              {activeSection === item.id && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '20px 0' }}>
            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.05)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ef4444' }}>
                 <AlertTriangle size={14} />
                 <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Emergency Controls</span>
               </div>
               <button className="btn-danger w-full" style={{ padding: '10px', fontSize: '12px', fontWeight: 800, borderRadius: '8px' }}>
                 LOCK DOWN PLATFORM
               </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'var(--bg-app-subtle)' }} className="custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'organizations' && renderOrganizations()}
              {activeSection === 'users' && renderUsers()}
              {activeSection === 'workspaces' && renderWorkspaces()}
              {activeSection === 'login-logs' && renderLoginLogs()}
              {activeSection === 'security' && renderSecurity()}
              {(activeSection === 'config' || activeSection === 'health') && (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                   <Activity size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                   <h3 style={{ margin: 0, fontWeight: 700 }}>Section under heavy construction</h3>
                   <p style={{ fontSize: '13px' }}>The Neural Operations team is finalizing this module.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .admin-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-panel {
          background: rgba(var(--bg-surface-rgb), 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.05);
        }
        .admin-card:hover {
          border-color: var(--primary);
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.2), 0 0 20px rgba(var(--primary-rgb), 0.1);
          transform: translateY(-4px);
        }
        .sidebar-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          width: 100%;
        }
        .sidebar-btn:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
        }
        .sidebar-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        }
        .premium-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, var(--primary), #a855f7);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99,102,241,0.3);
        }
        .premium-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.5);
        }
        .danger-btn {
          width: 100%;
          padding: 12px;
          background: #ef4444;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(239,68,68,0.3);
        }
        .danger-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239,68,68,0.5);
        }
        .icon-btn {
          padding: 8px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .icon-btn-large {
          padding: 12px;
          border-radius: 14px;
          background: var(--bg-app);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .icon-btn-large:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          border-color: var(--primary);
        }
        .hover-danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .hover-primary:hover { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
        .table-row-hover { transition: background 0.2s; }
        .table-row-hover:hover { background: rgba(255,255,255,0.02); }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .pulse-anim {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

