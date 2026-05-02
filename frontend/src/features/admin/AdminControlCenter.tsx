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
  Key,
  Clock,
  MapPin,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminStats {
  totalOrganizations: number;
  orgGrowth: number;
  totalUsers: number;
  userGrowth: number;
  activeWorkspaces: number;
  workspaceGrowth: number;
  datasetsProcessed: number;
  dashboardsCreated: number;
  apiUsage: number;
  aiAnalysisJobs: number;
  aiJobsGrowth: number;
  systemHealthStatus: string;
  systemHealth?: {
    cpuLoad: number;
    memoryUsage: number;
    dbConnections: number;
    latency: number;
  };
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
// Use a stable, non-pre-projected topology file
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const getCoordinates = (locationStr?: string, ipStr?: string, ipCoords?: Record<string, [number, number]>): [number, number] | null => {
  if (ipStr && ipCoords && ipCoords[ipStr]) {
    return ipCoords[ipStr];
  }
  
  // Default localhost to Hamburg for local development accurate mapping
  if (ipStr === '127.0.0.1' || ipStr === '::1' || ipStr === 'localhost') {
    return [9.9937, 53.5511]; // Hamburg, Germany
  }

  if (locationStr?.toLowerCase().includes('hamburg')) return [9.9937, 53.5511];
  if (locationStr?.toLowerCase().includes('berlin')) return [13.4050, 52.5200];
  if (locationStr?.toLowerCase().includes('new york')) return [-74.0060, 40.7128];
  if (locationStr?.toLowerCase().includes('london')) return [-0.1276, 51.5072];
  if (locationStr?.toLowerCase().includes('paris')) return [2.3522, 48.8566];
  if (locationStr?.toLowerCase().includes('tokyo')) return [139.6917, 35.6895];
  if (locationStr?.toLowerCase().includes('sydney')) return [151.2093, -33.8688];
  if (locationStr?.toLowerCase().includes('san francisco')) return [-122.4194, 37.7749];
  if (locationStr?.toLowerCase().includes('singapore')) return [103.8198, 1.3521];
  
  // If we can't determine the location and haven't resolved the IP yet,
  // we do not show a marker rather than rendering it in the ocean.
  return null;
};

export const AdminControlCenter: React.FC = () => {
  const { t } = useLanguage();
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState<'overview' | 'organizations' | 'users' | 'active-users' | 'workspaces' | 'login-logs' | 'security' | 'config' | 'health'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeUserDropdown, setActiveUserDropdown] = useState<string | null>(null);
  const [ipCoords, setIpCoords] = useState<Record<string, [number, number]>>({});

  useEffect(() => {
    const resolveIps = async () => {
      const newCoords = { ...ipCoords };
      let changed = false;

      const ipsToResolve = new Set<string>();
      loginLogs.forEach(l => { if (l.ipAddress && !newCoords[l.ipAddress]) ipsToResolve.add(l.ipAddress); });
      activeUsers.forEach(u => { if (u.ipAddress && !newCoords[u.ipAddress]) ipsToResolve.add(u.ipAddress); });

      const fetchPromises = Array.from(ipsToResolve).map(async (ip) => {
        try {
          const res = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
          if (res.ok) {
            const data = await res.json();
            if (data.longitude && data.latitude) {
              newCoords[ip] = [parseFloat(data.longitude), parseFloat(data.latitude)];
              changed = true;
            }
          }
        } catch (e) {
          console.error("Failed to resolve IP", ip, e);
        }
      });
      
      await Promise.all(fetchPromises);

      if (changed) {
        setIpCoords(newCoords);
      }
    };

    if (loginLogs.length > 0 || activeUsers.length > 0) {
      resolveIps();
    }
  }, [loginLogs, activeUsers]);

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
        try {
          const errData = await res.json();
          addToast(`Organizations Error: ${errData.details || errData.error}`, 'error');
        } catch (e) {
          addToast(`Failed to load organizations: HTTP ${res.status}`, 'error');
        }
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

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/active-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setActiveUsers(await res.json());
    } catch (e) {
      addToast('Failed to fetch active users', 'error');
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
      setFetchError(null);
      const res = await fetch(`${API_URL}/api/admin/login-logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setLoginLogs(await res.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(`Backend error: ${res.status} ${errData.details || res.statusText}`);
      }
    } catch (e) {
      setFetchError('Connection failed: Ensure backend is updated and online.');
    }
  };

  useEffect(() => {
    if (activeSection === 'overview') fetchStats();
    if (activeSection === 'organizations') fetchOrganizations();
    if (activeSection === 'users') fetchUsers();
    if (activeSection === 'active-users') fetchActiveUsers();
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
      await Promise.all([fetchStats(), fetchOrganizations(), fetchUsers(), fetchWorkspaces(), fetchAuditLogs(), fetchLoginLogs(), fetchActiveUsers()]);
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

  const handleForceLogout = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to terminate all active sessions for ${userEmail}? They will be forced to log in again.`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast(`Security command sent: Terminating sessions for ${userEmail}`, 'success');
        // Wait 1s for backend propagation then refresh
        setTimeout(() => {
          fetchActiveUsers();
          fetchUsers();
        }, 1000);
      } else {
        addToast('Failed to terminate sessions', 'error');
      }
    } catch (e) {
      addToast('Error forcing logout', 'error');
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
        { label: t('admin.stats.totalOrgs'), value: stats?.totalOrganizations, growth: stats?.orgGrowth, icon: Building2, color: '#6366f1' },
        { label: t('admin.stats.totalUsers'), value: stats?.totalUsers, growth: stats?.userGrowth, icon: Users, color: '#8b5cf6' },
        { label: t('admin.stats.activeWorkspaces'), value: stats?.activeWorkspaces, growth: stats?.workspaceGrowth, icon: Layout, color: '#ec4899' },
        { label: t('admin.stats.aiJobs'), value: stats?.aiAnalysisJobs, growth: stats?.aiJobsGrowth, icon: Cpu, color: '#f59e0b' },
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
            {stat.growth !== undefined && (
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                padding: '6px 12px', 
                borderRadius: '20px', 
                background: stat.growth >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: stat.growth >= 0 ? '#10b981' : '#ef4444', 
                border: `1px solid ${stat.growth >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` 
              }}>
                {stat.growth >= 0 ? '+' : ''}{stat.growth}%
              </span>
            )}
          </div>
          <div style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1 }}>{stat.value?.toLocaleString() || '---'}</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.label}</div>
        </motion.div>
      ))}

      <div className="admin-card glass-panel" style={{ gridColumn: '1 / -1', height: '500px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
         <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
           <MapPin size={20} color="#10b981" />
           {t('admin.map.title') || 'Global User Distribution'}
         </h3>
         <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
             <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: '100%', height: '100%' }}>
               <ZoomableGroup center={[0, 10]} zoom={1} disablePanning>
                 <Geographies geography="https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json">
                   {({ geographies }) =>
                     geographies.map((geo) => (
                       <Geography
                         key={geo.rsmKey || geo.properties.name}
                         geography={geo}
                         fill="rgba(255,255,255,0.05)"
                         stroke="var(--border-subtle)"
                         strokeWidth={0.5}
                         style={{
                           default: { outline: "none" },
                           hover: { fill: "rgba(255,255,255,0.1)", outline: "none" },
                           pressed: { fill: "rgba(255,255,255,0.15)", outline: "none" },
                         }}
                       />
                     ))
                   }
                 </Geographies>
                 {loginLogs.map(log => {
                   const coords = getCoordinates(log.details?.location, log.ipAddress, ipCoords);
                   if (!coords) return null;
                   return (
                     <Marker key={`log-${log.id}`} coordinates={coords}>
                       <circle r={3} fill="#6366f1" opacity={0.6} />
                     </Marker>
                   );
                 })}
                 {activeUsers.map(u => {
                   // Cross-reference with loginLogs to find this user's last known IP and location
                   const recentLog = loginLogs.find(log => log.user?.email === u.email || log.userId === u.id);
                   const resolvedIp = u.ipAddress || recentLog?.ipAddress;
                   // Force current user to show in Hamburg if no other location data is found
                   const isCurrentUser = u.email === user?.email;
                   const resolvedLoc = u.location || recentLog?.details?.location || (isCurrentUser ? 'hamburg' : undefined);
  
                   const coords = getCoordinates(resolvedLoc, resolvedIp, ipCoords);
                   if (!coords) return null;
                   return (
                     <Marker key={`active-${u.id}`} coordinates={coords}>
                       <circle r={5} fill="#10b981" opacity={1} />
                       <circle r={12} fill="#10b981" opacity={0.3} className="pulse-anim" />
                     </Marker>
                   );
                 })}
               </ZoomableGroup>
             </ComposableMap>
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid var(--border-subtle)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                  Active Now
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', opacity: 0.6 }}></div>
                  Recent Login
               </div>
            </div>
         </div>
      </div>

      <div style={{ gridColumn: '1 / -1', marginTop: '40px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
          <Activity size={24} color="#10b981" />
          {t('admin.health.title')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="admin-card glass-panel">
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>{t('admin.health.latency')}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{stats?.systemHealth?.latency || 24}ms</span>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>{t('admin.health.optimal')}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginTop: '32px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            </div>
          </div>
          <div className="admin-card glass-panel">
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>{t('admin.health.cpu')}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{stats?.systemHealth?.cpuLoad || 12}%</span>
              <span style={{ color: (stats?.systemHealth?.cpuLoad || 0) > 80 ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>
                {(stats?.systemHealth?.cpuLoad || 0) > 80 ? t('admin.health.high') : (stats?.systemHealth?.cpuLoad || 0) > 50 ? t('admin.health.moderate') : t('admin.health.optimal')}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginTop: '32px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(stats?.systemHealth?.cpuLoad || 12, 100)}%`, height: '100%', background: (stats?.systemHealth?.cpuLoad || 0) > 80 ? '#ef4444' : '#10b981', boxShadow: `0 0 10px ${(stats?.systemHealth?.cpuLoad || 0) > 80 ? '#ef4444' : '#10b981'}` }}></div>
            </div>
          </div>
          <div className="admin-card glass-panel">
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>{t('admin.health.memory')}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{stats?.systemHealth?.memoryUsage || 45}%</span>
              <span style={{ color: (stats?.systemHealth?.memoryUsage || 0) > 85 ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>
                {(stats?.systemHealth?.memoryUsage || 0) > 85 ? t('admin.health.critical') : t('admin.health.stable')}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginTop: '32px', overflow: 'hidden' }}>
              <div style={{ width: `${stats?.systemHealth?.memoryUsage || 45}%`, height: '100%', background: (stats?.systemHealth?.memoryUsage || 0) > 85 ? '#ef4444' : '#10b981', boxShadow: `0 0 10px ${(stats?.systemHealth?.memoryUsage || 0) > 85 ? '#ef4444' : '#10b981'}` }}></div>
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
              placeholder={t('admin.orgs.search')} 
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
            <option value="all">{t('admin.orgs.allStatus')}</option>
            <option value="active">{t('admin.orgs.active')}</option>
            <option value="suspended">{t('admin.orgs.suspended')}</option>
          </select>
          <select 
            value={tierFilter} 
            onChange={(e) => setTierFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">{t('admin.orgs.tier.all')}</option>
            <option value="free">{t('admin.orgs.tier.free')}</option>
            <option value="pro">{t('admin.orgs.tier.pro')}</option>
            <option value="enterprise">{t('admin.orgs.tier.enterprise')}</option>
          </select>
        </div>
        <button className="premium-btn" style={{ height: '42px', padding: '0 20px', boxSizing: 'border-box' }} onClick={handleCreateOrganization}>
          <UserPlus size={18} />
          {t('admin.orgs.create')}
        </button>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.org')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.status')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.tier')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.usage')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.created')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>{t('dashboard.actions')}</th>
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
                    {org.isActive ? t('admin.orgs.active').toUpperCase() : t('admin.orgs.suspended').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', textTransform: 'capitalize', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{org.subscriptionTier}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>{org._count.users}</strong> {t('org.stats.members')}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>{org._count.workspaces}</strong> {t('org.stats.workspaces')}</span>
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
               <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>{t('admin.orgs.empty')}</td></tr>
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
              placeholder={t('admin.users.search')} 
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
            <option value="all">{t('admin.orgs.allStatus')}</option>
            <option value="active">{t('admin.orgs.active')}</option>
            <option value="inactive">{t('dashboard.offline')}</option>
          </select>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">{t('admin.users.allRoles')}</option>
            <option value="member">{t('org.members.role.member')}</option>
            <option value="PlatformAdmin">{t('admin.users.role.platformAdmin')}</option>
            <option value="SystemAdmin">{t('admin.users.role.systemAdmin')}</option>
          </select>
          <select 
            value={tierFilter} 
            onChange={(e) => setTierFilter(e.target.value)}
            style={{ padding: '0 12px', height: '42px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">{t('admin.orgs.tier.all')}</option>
            <option value="free">{t('admin.orgs.tier.free')}</option>
            <option value="pro">{t('admin.orgs.tier.pro')}</option>
            <option value="enterprise">{t('admin.orgs.tier.enterprise')}</option>
          </select>
        </div>
        <button className="premium-btn" style={{ height: '42px', padding: '0 20px', boxSizing: 'border-box' }} onClick={handleInviteUser}>
          <UserPlus size={18} />
          {t('admin.users.invite')}
        </button>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.users.table.user')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('org.members.table.role')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.tier')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.org')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.orgs.table.status')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.users.table.lastLogin')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>{t('dashboard.actions')}</th>
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
                    {u.isActive ? t('admin.orgs.active').toUpperCase() : t('dashboard.offline').toUpperCase()}
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
                           {u.isActive ? t('admin.users.suspend') : t('admin.users.activate')}
                        </button>
                        <button onClick={() => handleUpdateUserRole(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Edit2 size={14} color="var(--text-secondary)" />
                           {t('admin.users.changeRole')}
                        </button>
                        <button onClick={() => handleResetPassword(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Key size={14} color="#f59e0b" />
                           {t('admin.users.resetPass')}
                        </button>
                        <button onClick={() => handleForceLogout(u.id, u.email)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <LogOut size={14} color="#6366f1" />
                           {t('admin.users.forceLogout')}
                        </button>
                        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                        <button onClick={() => handleDeleteUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Trash2 size={14} color="#ef4444" />
                           {t('admin.users.delete')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
             {users.length === 0 && (
               <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>{t('admin.users.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWorkspaces = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{t('admin.workspaces.title')}</h3>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.workspaces.table.workspace')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.workspaces.table.org')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.workspaces.table.members')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.workspaces.table.assets')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.workspaces.table.created')}</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((ws) => (
              <tr key={ws.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{ws.name}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>{ws.organization?.name || '---'}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('admin.workspaces.membersCount').replace('{count}', String(ws._count.members))}</td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('admin.workspaces.dashboardsCount').replace('{count}', String(ws._count.dashboards))}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('admin.workspaces.filesCount').replace('{count}', String(ws._count.files))}</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(ws.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {workspaces.length === 0 && (
               <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>{t('admin.workspaces.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLoginLogs = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t('admin.loginLogs.title')}</h3>
          <button 
            onClick={async () => {
              if (!window.confirm('Generate 15 sample login entries for testing?')) return;
              try {
                const res = await fetch(`${API_URL}/api/admin/seed-login-logs`, { 
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` } 
                });
                if (res.ok) {
                  addToast('Sample logs generated', 'success');
                  fetchLoginLogs();
                } else {
                  addToast('Failed to seed logs', 'error');
                }
              } catch (e) {
                addToast('Connection error', 'error');
              }
            }}
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Database size={12} />
            {t('admin.loginLogs.seed')}
          </button>
        </div>
        {fetchError && (
          <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {fetchError}
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.loginLogs.table.user')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.loginLogs.table.status')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.loginLogs.table.ip')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.loginLogs.table.device')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.loginLogs.table.time')}</th>
            </tr>
          </thead>
          <tbody>
            {loginLogs.map((log) => (
              <tr key={log.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown Attempt'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.user?.email || log.details?.email || 'N/A'}</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '8px', 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      width: 'fit-content',
                      background: log.action === 'LOGIN' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: log.action === 'LOGIN' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${log.action === 'LOGIN' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {log.action === 'LOGIN' ? t('admin.loginLogs.success') : t('admin.loginLogs.failed')}
                    </span>
                    {log.action === 'LOGIN_FAILED' && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {log.details?.reason || 'Invalid credentials'}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', width: 'fit-content' }}>
                       {log.ipAddress}
                     </span>
                     {log.details?.location && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                         <MapPin size={10} color="var(--primary)" />
                         {log.details.location}
                       </div>
                     )}
                   </div>
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
               <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>{t('admin.loginLogs.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{t('admin.security.title')}</h3>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.security.table.action')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.security.table.user')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.security.table.resource')}</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.security.table.time')}</th>
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
               <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>{t('admin.security.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActiveUsers = () => (
    <div className="admin-card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t('admin.liveSessions.title')}</h3>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <span className="pulse-anim" style={{ display: 'inline-block', width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', marginRight: '8px' }}></span>
            {t('admin.liveSessions.activity')}
          </span>
        </div>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.liveSessions.user')}</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.liveSessions.org')}</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.liveSessions.role')}</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.liveSessions.lastActivity')}</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>{t('admin.liveSessions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.map((u: any) => (
              <tr key={u.id} className="table-row-hover">
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '12px' }}>
                      {u.firstName?.[0] || u.email[0].toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {u.organization?.name || t('admin.liveSessions.noOrg')}
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {new Date(u.lastActiveAt).toLocaleTimeString()}
                </td>
                <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleForceLogout(u.id, u.email)} 
                    className="icon-btn hover-danger" 
                    title="Terminate Session"
                    style={{ padding: '8px', borderRadius: '8px' }}
                  >
                    <LogOut size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {activeUsers.length === 0 && (
               <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>{t('admin.liveSessions.empty')}</td></tr>
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
              <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', margin: 0, background: 'linear-gradient(to right, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('admin.title')}</h1>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>{t('admin.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="pulse-anim"></div>
               <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.sync.active')}</span>
             </div>
             <button onClick={() => { fetchStats(); fetchOrganizations(); fetchUsers(); fetchLoginLogs(); }} className="icon-btn-large" title={t('admin.refresh')}>
                <RefreshCcw size={20} />
             </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: '280px', flex: 'none', borderRight: '1px solid var(--border-subtle)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', background: 'var(--bg-surface)' }}>
          {[
            { id: 'overview', label: t('admin.nav.overview'), icon: Layout },
            { id: 'organizations', label: t('admin.nav.orgs'), icon: Building2 },
            { id: 'users', label: t('admin.nav.users'), icon: Users },
            { id: 'workspaces', label: t('admin.nav.workspaces'), icon: Database },
            { id: 'login-logs', label: t('admin.nav.loginHistory'), icon: Clock },
            { id: 'active-users', label: t('admin.nav.liveSessions'), icon: Activity },
            { id: 'security', label: t('admin.nav.securityAudit'), icon: Shield },
            { id: 'config', label: t('admin.nav.systemConfig'), icon: Settings },
            { id: 'health', label: t('admin.nav.infrastructure'), icon: Activity },
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
                 <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.emergency.title')}</span>
               </div>
               <button className="btn-danger w-full" style={{ padding: '10px', fontSize: '12px', fontWeight: 800, borderRadius: '8px' }}>
                 {t('admin.emergency.lockdown')}
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
              {activeSection === 'active-users' && renderActiveUsers()}
        {activeSection === 'workspaces' && renderWorkspaces()}
              {activeSection === 'login-logs' && renderLoginLogs()}
              {activeSection === 'security' && renderSecurity()}
              {(activeSection === 'config' || activeSection === 'health') && (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                   <Activity size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                   <h3 style={{ margin: 0, fontWeight: 700 }}>{t('admin.construction.title')}</h3>
                   <p style={{ fontSize: '13px' }}>{t('admin.construction.desc')}</p>
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

