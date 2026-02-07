import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { io } from 'socket.io-client';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { API_URL } from './config';
import { Header } from './components/layout/Header';
import { RootLayout } from './components/layout/RootLayout';
import { CommandPalette } from './components/ui/CommandPalette';
import { useToast } from './components/ui/Toast';
import { TabBar } from './components/layout/TabBar';
import type { TabType } from './components/layout/TabBar';
import {
  LayoutDashboard,
  Settings,
  CloudUpload,
  Palette,
  LogOut
} from 'lucide-react';
import { OnboardingTour } from './components/ui/OnboardingTour';
import './index.css';

// Lazy Load Heavy Views
const LoginView = React.lazy(() => import('./features/auth/LoginView').then(m => ({ default: m.LoginView })));
const RegisterView = React.lazy(() => import('./features/auth/RegisterView').then(m => ({ default: m.RegisterView })));
const DashboardView = React.lazy(() => import('./features/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const AnalysisView = React.lazy(() => import('./features/analysis/AnalysisView').then(m => ({ default: m.AnalysisView })));
const CorrelationView = React.lazy(() => import('./features/analysis/CorrelationView').then(m => ({ default: m.CorrelationView })));
const SettingsView = React.lazy(() => import('./features/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const LandingView = React.lazy(() => import('./features/landing/LandingView').then(m => ({ default: m.LandingView })));
const BiSelectionView = React.lazy(() => import('./features/bi/BiSelectionView').then(m => ({ default: m.BiSelectionView })));
const BiView = React.lazy(() => import('./features/bi/BiView').then(m => ({ default: m.BiView })));
const MigrationView = React.lazy(() => import('./features/migration/MigrationView').then(m => ({ default: m.MigrationView })));
const NexusView = React.lazy(() => import('./features/oracle/OracleView').then(m => ({ default: m.NexusView })));
const ConnectorsView = React.lazy(() => import('./features/sources/ConnectorsView').then(m => ({ default: m.ConnectorsView })));
const ProjectsView = React.lazy(() => import('./features/projects/ProjectsView').then(m => ({ default: m.ProjectsView })));
const DeveloperView = React.lazy(() => import('./features/developer/DeveloperView').then(m => ({ default: m.DeveloperView })));
const RoadGraphView = React.lazy(() => import('./features/logistics/RoadGraphView'));
const AgenticSystemsView = React.lazy(() => import('./features/agentic/AgenticSystemsView').then(m => ({ default: m.AgenticSystemsView })));
const SelfServiceStudio = React.lazy(() => import('./features/democratization/SelfServiceStudio').then(m => ({ default: m.SelfServiceStudio })));
// const RoadView = React.lazy(() => import('./features/logistics/RoadView').then(m => ({ default: m.RoadView })));

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-[var(--bg-app)]" style={{ minHeight: '60vh' }}>
    <div className="flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] skeleton-shimmer border border-[var(--border-subtle)]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <div className="flex-col items-center gap-1">
        <div className="text-h3 tech-text" style={{ fontSize: '10px', opacity: 0.5 }}>Synthesizing Knowledge</div>
        <div className="w-32 h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--primary)] skeleton-shimmer" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  </div>
);

// Types
interface FileData {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  isFavorite?: boolean;
  groupId?: string;
}



// Main App Component
function AppContent() {
  const { user, token, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  // --- Global State ---
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Tab State
  const [tabs, setTabs] = useState<TabType[]>([{ id: 'landing', title: 'Home', type: 'landing' }]);
  const [activeTabId, setActiveTabId] = useState('landing');

  // Files State (Shared across tabs)
  const [files, setFiles] = useState<FileData[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Analyzing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // --- Theme State ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // --- Onboarding State ---
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('is_new_user') === 'true' && !localStorage.getItem('nalyse_onboarding_completed')) {
      setShowTour(true);
      // Remove the flag so it doesn't show again on next refresh unless registration happens again
      localStorage.removeItem('is_new_user');
    }
  }, [isAuthenticated]);

  const handleTourComplete = () => {
    localStorage.setItem('nalyse_onboarding_completed', 'true');
    setShowTour(false);
  };

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for external theme changes (from SettingsView)
  useEffect(() => {
    const handleExternalChange = () => {
      const stored = localStorage.getItem('theme') as 'dark' | 'light';
      if (stored && stored !== theme) {
        setTheme(stored);
      }
    };
    window.addEventListener('theme-change', handleExternalChange);
    return () => window.removeEventListener('theme-change', handleExternalChange);
  }, [theme]);

  const applyTheme = (newTheme: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', newTheme);
    // Remove legacy inline styles if any
    const props = [
      '--bg-app', '--bg-sidebar', '--bg-card', '--bg-surface', '--bg-surface-hover',
      '--text-primary', '--text-secondary', '--text-tertiary', '--text-inverse',
      '--border-default', '--border-subtle', '--border-highlight',
      '--primary', '--primary-hover', '--success', '--warning', '--danger'
    ];
    props.forEach(p => document.documentElement.style.removeProperty(p));
    // We rely on index.css now
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // --- Tab Management ---
  const openTab = useCallback((type: TabType['type'], title: string, data?: any) => {
    // Smart Duplicate Prevention
    const existing = tabs.find(t => {
      if (t.type !== type) return false;
      if (['dashboard', 'settings', 'correlate', 'landing', 'nexus', 'democracy'].includes(type)) return true;
      if (type === 'bi' && !data && !t.data) return true; // BI Menu singleton
      if (t.title === title) return true; // Match by title (e.g. filename)
      return false;
    });

    if (existing) {
      if (data && existing.data !== data) {
        setTabs(prev => prev.map(t => t.id === existing.id ? { ...t, data } : t));
      }
      setActiveTabId(existing.id);
      return;
    }

    const newTab: TabType = {
      id: type + '-' + Date.now(),
      title,
      type,
      data
    };

    let newTabs = [...tabs];
    if (tabs.length === 1 && tabs[0].type === 'landing' && type === 'dashboard') {
      newTabs = [];
    }

    setTabs([...newTabs, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  const closeTab = useCallback((id: string) => {
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      if (isAuthenticated) {
        setTabs([{ id: 'dash-default', title: 'Dashboard', type: 'dashboard' }]);
        setActiveTabId('dash-default');
      } else {
        setTabs([{ id: 'landing', title: 'Home', type: 'landing' }]);
        setActiveTabId('landing');
      }
    } else {
      setTabs(newTabs);
      if (id === activeTabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
  }, [tabs, activeTabId, isAuthenticated]);

  const closeOtherTabs = useCallback((id: string) => {
    const tabToKeep = tabs.find(t => t.id === id);
    if (tabToKeep) {
      setTabs([tabToKeep]);
      setActiveTabId(id);
    }
  }, [tabs]);

  const closeTabsToRight = useCallback((id: string) => {
    const index = tabs.findIndex(t => t.id === id);
    if (index !== -1) {
      const newTabs = tabs.slice(0, index + 1);
      setTabs(newTabs);
      if (!newTabs.some(t => t.id === activeTabId)) {
        setActiveTabId(id);
      }
    }
  }, [tabs, activeTabId]);

  const closeTabsToLeft = useCallback((id: string) => {
    const index = tabs.findIndex(t => t.id === id);
    if (index !== -1) {
      const newTabs = tabs.slice(index);
      setTabs(newTabs);
      if (!newTabs.some(t => t.id === activeTabId)) {
        setActiveTabId(id);
      }
    }
  }, [tabs, activeTabId]);

  const closeAllTabs = useCallback(() => {
    if (isAuthenticated) {
      setTabs([{ id: 'dash-default', title: 'Dashboard', type: 'dashboard' }]);
      setActiveTabId('dash-default');
    } else {
      setTabs([{ id: 'landing', title: 'Home', type: 'landing' }]);
      setActiveTabId('landing');
    }
  }, [isAuthenticated]);

  const moveTab = useCallback((fromIndex: number, toIndex: number) => {
    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);
    setTabs(newTabs);
  }, [tabs]);

  // Fetch Files
  const fetchFiles = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error('Failed to fetch files:', e);
    }
  }, [token]);

  // Fetch Groups
  const fetchGroups = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.error('Failed to fetch groups:', e);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
      fetchGroups();
      // Automatically switch to dashboard if on landing
      if (tabs.length === 1 && tabs[0].type === 'landing') {
        setTabs([{ id: 'dash-main', title: 'Dashboard', type: 'dashboard' }]);
        setActiveTabId('dash-main');
      }
    }
  }, [isAuthenticated, fetchFiles, fetchGroups]);

  // --- Real-time WebSocket Updates ---
  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL);

    socket.on('live_update', (payload: any) => {
      console.log('📡 Real-time update received:', payload);

      // Handle File Updates
      if (payload.entity === 'file') {
        // Refresh file list if it belongs to current user
        if (payload.data.userId === user?.id || !payload.data.userId) {
          fetchFiles();

          // If it's an analysis update and the tab is open, update the tab data
          if (payload.data.action === 'analysis_complete' && payload.data.analysis) {
            setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.type === 'analysis' && tab.data?.fileId === payload.data.fileId) {
                return { ...tab, data: payload.data.analysis };
              }
              // Also handle matches by filename if fileId is not in tab data
              if (tab.type === 'analysis' && tab.title === payload.data.analysis.filename) {
                return { ...tab, data: payload.data.analysis };
              }
              return tab;
            }));

            addToast(`Live update: ${payload.data.analysis.filename || 'Source'} refreshed`, 'success');
          }
        }
      }

      // Handle Source Updates (Connectors)
      if (payload.entity === 'source_data') {
        // Find if any analysis tab is open that matches this source
        // This is tricky because "source" analysis tabs might not have a clean ID path
        // but we can look for specific metadata if we added it.
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.id, fetchFiles, addToast]);


  // --- Action Handlers ---

  const handleUpload = async (file: File) => {
    if (!token) {
      addToast('Please login to upload files', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsAnalyzing(true);

    try {
      const uploadRes = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const { file: newFile } = await uploadRes.json();
      await fetchFiles();

      const analyzeRes = await fetch(`${API_URL}/api/files/${newFile.id}/analyze`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!analyzeRes.ok) throw new Error('Analysis failed');

      const analysisData = await analyzeRes.json();

      openTab('analysis', newFile.filename, analysisData);
      addToast('File analyzed successfully!', 'success');

    } catch (e: any) {
      addToast(e.message || 'Upload failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBiFileUpload = async (file: File, type: string) => {
    if (!token) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { file: newFile } = await uploadRes.json();
      await fetchFiles();

      const analyzeRes = await fetch(`${API_URL}/api/files/${newFile.id}/analyze`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const analysisData = await analyzeRes.json();

      openTab('bi', `BI: ${type}`, {
        sampleData: analysisData.sampleData || [],
        metadata: { type: 'bi', useCase: type }
      });

    } catch (e: any) {
      addToast(e.message || 'Error processing file', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadDemo = async (type: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/bi/${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to load BI data');
      const biData = await res.json();

      openTab('bi', `Demo: ${type}`, {
        sampleData: biData.data,
        metadata: { type: 'bi', useCase: type }
      });
    } catch (e: any) {
      addToast('Error loading BI data', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeFile = async (file: FileData) => {
    if (!token) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/files/${file.id}/analyze`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      openTab('analysis', file.filename, data);
    } catch (e) {
      addToast('Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleFavorite = async (file: FileData) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/files/${file.id}/favorite`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.map(f => f.id === file.id ? { ...f, isFavorite: !f.isFavorite } : f));
    } catch (e) {
      addToast('Failed to update favorite', 'error');
    }
  };

  const handleUpdateFileGroup = async (fileId: string, groupId: string | null) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/files/${fileId}/group`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ groupId })
      });
      if (res.ok) {
        await fetchFiles();
        await fetchGroups();
        addToast('File grouping updated', 'success');
      }
    } catch (e) {
      addToast('Failed to update file group', 'error');
    }
  };

  const handleCreateGroup = async (name: string, description: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        await fetchGroups();
        addToast('Group created', 'success');
      }
    } catch (e) {
      addToast('Failed to create group', 'error');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/groups/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchFiles(); // Files might be ungrouped
        await fetchGroups();
        addToast('Group deleted', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Failed to delete group', 'error');
      }
    } catch (e) {
      addToast('Failed to delete group', 'error');
    }
  };

  const handleDeleteFile = async (file: FileData) => {
    if (!token) return;
    if (!confirm(`Delete "${file.filename}"?`)) return;
    try {
      await fetch(`${API_URL}/api/files/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(f => f.id !== file.id));
      addToast('File deleted', 'success');
    } catch (e) {
      addToast('Delete failed', 'error');
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    if (!token) return;
    if (!confirm(`Delete ${ids.length} files?`)) return;
    try {
      for (const id of ids) {
        await fetch(`${API_URL}/api/files/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setFiles(f => f.filter(file => !ids.includes(file.id)));
      addToast('Files deleted', 'success');
    } catch (e) {
      addToast('Delete failed', 'error');
    }
  };

  const handleShare = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab || (activeTab.type !== 'analysis' && activeTab.type !== 'bi') || !activeTab.data) return;
    if (!token) return;

    try {
      const saveRes = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: activeTab.title, config: activeTab.data })
      });
      const report = await saveRes.json();
      const shareRes = await fetch(`${API_URL}/api/reports/${report.id}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const shareData = await shareRes.json();
      navigator.clipboard.writeText(shareData.link);
      addToast('Link copied to clipboard!', 'success');
    } catch (e) {
      addToast('Share failed', 'error');
    }
  };

  // --- Command Palette ---
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const commands = [
    { id: 'dash', label: 'Go to Dashboard', icon: <LayoutDashboard size={18} />, action: () => openTab('dashboard', 'Dashboard'), category: 'Navigation' },
    { id: 'settings', label: 'Open Settings', icon: <Settings size={18} />, action: () => openTab('settings', 'Settings'), category: 'Navigation' },
    { id: 'upload', label: 'Upload New File', icon: <CloudUpload size={18} />, action: () => { openTab('dashboard', 'Dashboard'); document.getElementById('file-input')?.click(); }, category: 'Actions' },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: <Palette size={18} />, action: handleThemeToggle, category: 'Appearance' },
    { id: 'logout', label: 'Logout', icon: <LogOut size={18} />, action: logout, category: 'Account' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandPaletteOpen(p => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); openTab('dashboard', 'Dashboard'); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); openTab('settings', 'Settings'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTab]);

  // --- Render ---

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full" style={{ background: 'var(--bg-app)' }}>
        <div className="text-h2">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        {authView === 'login' ? (
          <LoginView onSwitchToRegister={() => setAuthView('register')} onSuccess={() => {
            // Trigger useEffect to set dashboard
          }} />
        ) : (
          <RegisterView onSwitchToLogin={() => setAuthView('login')} onSuccess={() => { }} />
        )}
      </Suspense>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-screen w-full" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
        <div className="flex-col items-center gap-4">
          <div className="text-h2">Loading Data...</div>
          <div style={{ width: '200px', height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '50%', height: '100%', background: 'var(--primary)', animation: 'progress 1s infinite alternate' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Active Tab
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const currentViewType = activeTab?.type || 'dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="noise-overlay"></div>
      <Header theme={theme} onThemeToggle={handleThemeToggle} />

      <RootLayout
        currentView={currentViewType}
        onViewChange={(viewType) => {
          const title = viewType === 'nexus' ? 'Nexus AI' :
            viewType === 'logistics' ? 'Road Intelligence' :
              viewType === 'agentic' ? 'Agentic Systems' :
                viewType === 'democracy' ? 'Self-Service Studio' :
                  viewType.charAt(0).toUpperCase() + viewType.slice(1);
          openTab(viewType, title);
        }}
        tabBar={
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onActivate={setActiveTabId}
            onClose={closeTab}
            onCloseOthers={closeOtherTabs}
            onCloseRight={closeTabsToRight}
            onCloseLeft={closeTabsToLeft}
            onCloseAll={closeAllTabs}
            onMove={moveTab}
          />
        }
      >
        <Suspense fallback={<PageLoader />}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {tabs.map(tab => (
              <div key={tab.id} style={{ display: tab.id === activeTabId ? 'block' : 'none', height: '100%' }}>

                {tab.type === 'landing' && (
                  <LandingView onGetStarted={() => openTab('dashboard', t('nav.workspace'))} />
                )}

                {tab.type === 'dashboard' && (
                  <DashboardView
                    userEmail={user?.email || ''}
                    firstName={user?.firstName}
                    userPlan={(user as any)?.organization?.plan || 'free'}
                    files={files}
                    groups={groups}
                    onUpload={handleUpload}
                    onUpgrade={() => openTab('settings', t('nav.settings'), { initialTab: 'subscription' })}
                    onFileSelect={handleAnalyzeFile}
                    onDeleteFile={handleDeleteFile}
                    onDeleteMultiple={handleDeleteMultiple}
                    onToggleFavorite={handleToggleFavorite}
                    onUpdateFileGroup={handleUpdateFileGroup}
                    onCreateGroup={handleCreateGroup}
                    onDeleteGroup={handleDeleteGroup}
                    dragActive={dragActive}
                    handleDrag={(e: any) => { e.preventDefault(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); }}
                    handleDrop={(e: any) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); }}
                  />
                )}

                {tab.type === 'analysis' && tab.data && (
                  <AnalysisView
                    analysis={tab.data}
                    onClose={() => closeTab(tab.id)}
                    onShare={handleShare}
                    onUpgradeRequested={() => openTab('settings', 'Settings', { initialTab: 'subscription' })}
                  />
                )}

                {tab.type === 'bi' && !tab.data && (
                  <BiSelectionView onLoadDemo={handleLoadDemo} onUploadFile={handleBiFileUpload} />
                )}

                {tab.type === 'bi' && tab.data && (
                  <BiView
                    data={tab.data.sampleData || []}
                    useCase={tab.data.metadata?.useCase || ''}
                    onClose={() => closeTab(tab.id)}
                  />
                )}

                {tab.type === 'correlate' && (
                  <CorrelationView
                    files={files}
                    token={token || ''}
                    onUpgradeRequested={() => openTab('settings', 'Settings', { initialTab: 'subscription' })}
                  />
                )}

                {tab.type === 'migration' && (
                  <MigrationView onClose={() => openTab('dashboard', 'Dashboard')} />
                )}

                {tab.type === 'nexus' && (
                  <NexusView files={files} groups={groups} token={token || ''} onProjectCreated={() => {
                    openTab('projects', 'Strategic Board');
                  }} />
                )}

                {tab.type === 'projects' && (
                  <ProjectsView token={token || ''} />
                )}

                {tab.type === 'developer' && (
                  <DeveloperView token={token || ''} />
                )}

                {tab.type === 'sources' && (
                  <ConnectorsView token={token || ''} />
                )}

                {tab.type === 'logistics' && (
                  <RoadGraphView onClose={() => closeTab(tab.id)} />
                )}

                {tab.type === 'agentic' && (
                  <AgenticSystemsView />
                )}

                {tab.type === 'democracy' && (
                  <SelfServiceStudio files={files} token={token || ''} apiUrl={API_URL} />
                )}

                {tab.type === 'settings' && (
                  <SettingsView
                    userEmail={user?.email || ''}
                    onClose={() => openTab('dashboard', 'Dashboard')}
                    onLogout={logout}
                    initialTab={tab.data?.initialTab}
                  />
                )}

              </div>
            ))}
          </div>
        </Suspense>

        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
      </RootLayout>

      {showTour && <OnboardingTour onComplete={handleTourComplete} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
