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
  Filter
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
  isActive: boolean;
  lastLoginAt: string | null;
  organization: {
    name: string;
  } | null;
}

export const AdminControlCenter: React.FC = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState<'overview' | 'organizations' | 'users' | 'workspaces' | 'security' | 'config' | 'health'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      if (res.ok) setOrganizations(await res.json());
    } catch (e) {
      addToast('Failed to fetch organizations', 'error');
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

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchOrganizations(), fetchUsers()]);
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

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          className="admin-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl" style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">+12%</span>
          </div>
          <div className="text-2xl font-black tracking-tight">{stat.value?.toLocaleString() || '---'}</div>
          <div className="text-sm font-medium opacity-50">{stat.label}</div>
        </motion.div>
      ))}

      <div className="col-span-full mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity size={20} className="text-emerald-500" />
          System Health Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="admin-card">
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">API Latency</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black">24ms</span>
              <span className="text-emerald-500 text-xs font-bold mb-1">OPTIMAL</span>
            </div>
            <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-4 overflow-hidden">
              <div className="w-full h-full bg-emerald-500"></div>
            </div>
          </div>
          <div className="admin-card">
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Worker Load</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black">12%</span>
              <span className="text-emerald-500 text-xs font-bold mb-1">IDLE</span>
            </div>
            <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-4 overflow-hidden">
              <div className="w-[12%] h-full bg-emerald-500"></div>
            </div>
          </div>
          <div className="admin-card">
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">DB Connections</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black">148</span>
              <span className="text-emerald-500 text-xs font-bold mb-1">STABLE</span>
            </div>
            <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-4 overflow-hidden">
              <div className="w-[45%] h-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrganizations = () => (
    <div className="admin-card p-0 overflow-hidden">
      <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            type="text" 
            placeholder="Search organizations..." 
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-bold">
          <UserPlus size={18} />
          Create Organization
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-surface)] text-[10px] font-black uppercase tracking-widest opacity-50">
            <tr>
              <th className="px-6 py-4">Organization</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Tier</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {organizations.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase())).map((org) => (
              <tr key={org.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold">{org.name}</span>
                    <span className="text-xs opacity-50">{org.id.split('-')[0]}...</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black ${org.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {org.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>
                <td className="px-6 py-4 capitalize">{org.subscriptionTier}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs">{org._count.users} Users</span>
                    <span className="text-xs">{org._count.workspaces} Workspaces</span>
                  </div>
                </td>
                <td className="px-6 py-4 opacity-50">{new Date(org.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleSuspendOrg(org.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
                      <Lock size={16} />
                    </button>
                    <button className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                      <Settings size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-card p-0 overflow-hidden">
      <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            type="text" 
            placeholder="Search users globally..." 
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-surface)] text-[10px] font-black uppercase tracking-widest opacity-50">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Organization</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
              <tr key={u.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-[10px] font-black">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">{u.firstName} {u.lastName}</span>
                      <span className="text-xs opacity-50">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-full text-[10px] font-black ${u.role === 'SystemAdmin' || u.role === 'PlatformAdmin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">{u.organization?.name || '---'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black ${u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 opacity-50">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
      <div className="flex-none p-8 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-500 rounded-lg text-white shadow-lg shadow-red-500/20">
                <Shield size={20} />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Admin Control Center</h1>
            </div>
            <p className="text-sm font-medium opacity-50">Operational governance & platform synchronization</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Platform Sync: Active</span>
             </div>
             <button onClick={() => { fetchStats(); fetchOrganizations(); fetchUsers(); }} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-all">
                <RefreshCcw size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-64 flex-none border-r border-[var(--border-subtle)] p-6 flex flex-col gap-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Layout },
            { id: 'organizations', label: 'Organizations', icon: Building2 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'workspaces', label: 'Workspace Hub', icon: Database },
            { id: 'security', label: 'Security & Audit', icon: Shield },
            { id: 'config', label: 'System Config', icon: Settings },
            { id: 'health', label: 'Infrastructure', icon: Activity },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                activeSection === item.id 
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]' 
                : 'hover:bg-[var(--bg-surface)] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
              <ChevronRight size={14} className={activeSection === item.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}

          <div className="mt-auto">
             <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
               <div className="flex items-center gap-2 text-red-500 mb-2">
                 <AlertTriangle size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Emergency Controls</span>
               </div>
               <button className="w-full py-2 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">
                 Lock Down Platform
               </button>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'organizations' && renderOrganizations()}
              {activeSection === 'users' && renderUsers()}
              {['workspaces', 'security', 'config', 'health'].includes(activeSection) && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                  <Database size={64} className="mb-4" />
                  <h3 className="text-xl font-bold">Module Synchronization Required</h3>
                  <p className="text-sm font-medium max-w-xs mx-auto">This administrative neural link is being initialized. Real-time data streams will appear shortly.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .admin-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 24px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .admin-card:hover {
          border-color: var(--primary);
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.2);
          transform: translateY(-4px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
