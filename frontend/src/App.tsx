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
import { ProcessingOverlay } from './components/ui/ProcessingOverlay';
import { ProBackdrop } from './components/layout/ProBackdrop';
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
const MultiAnalysisView = React.lazy(() => import('./features/analysis/MultiAnalysisView').then(m => ({ default: m.MultiAnalysisView })));
const VersionDiffView = React.lazy(() => import('./features/diff/VersionDiffView').then(m => ({ default: m.VersionDiffView })));
const AnomalyDetectionView = React.lazy(() => import('./features/anomaly/AnomalyDetectionView').then(m => ({ default: m.AnomalyDetectionView })));
const FinancialRiskView = React.lazy(() => import('./features/financial/FinancialRiskView').then(m => ({ default: m.FinancialRiskView })));
const SimulationView = React.lazy(() => import('./features/simulation/SimulationView').then(m => ({ default: m.SimulationView })));
const AutomationView = React.lazy(() => import('./features/automation/AutomationView').then(m => ({ default: m.AutomationView })));
const OrganizationView = React.lazy(() => import('./features/organization/OrganizationView').then(m => ({ default: m.OrganizationView })));
const CollaborationView = React.lazy(() => import('./features/collaboration/CollaborationView').then(m => ({ default: m.CollaborationView })));



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
  const isPro = (user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro';
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
  const [analysisStage, setAnalysisStage] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'processing' | 'completed' | 'error'>('processing');
  const [analysisError, setAnalysisError] = useState<string | undefined>();
  const [lastWorkerResult, setLastWorkerResult] = useState<{ type: string; title: string; data: any } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // --- Theme State ---
  const [theme, setTheme] = useState<'dark' | 'light' | 'midnight'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light' | 'midnight') || 'dark';
  });

  // Helper for staged analysis progress
  const runAnalysisWithProgress = async (workerFn: () => Promise<void | { type: string; title: string; data: any }>) => {
    setIsAnalyzing(true);
    setAnalysisStage(0);
    setAnalysisStatus('processing');
    setAnalysisError(undefined);
    setLastWorkerResult(null);

    let currentStage = 0;
    const stageInterval = setInterval(() => {
      if (currentStage < 3) { // Stop at 'Generating Insights', 'Ready' is manual
        currentStage++;
        setAnalysisStage(currentStage);
      }
    }, 1500);

    try {
      const result = await workerFn();
      clearInterval(stageInterval);
      setAnalysisStage(4); // 'Ready'
      setAnalysisStatus('completed');
      if (result) setLastWorkerResult(result);
    } catch (err: any) {
      clearInterval(stageInterval);
      setAnalysisStatus('error');
      setAnalysisError(err.message || 'The neural pipeline encountered a structural anomaly.');
    }
  };

  // --- Onboarding State ---
  const [showTour, setShowTour] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('is_new_user') === 'true' && !localStorage.getItem('nalyse_onboarding_completed')) {
      setShowTour(true);
      // Remove the flag so it doesn't show again on next refresh unless registration happens again
      localStorage.removeItem('is_new_user');
    }
  }, [isAuthenticated]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('nalyse_onboarding_completed', 'true');
    addToast('Onboarding complete. Welcome to the Apex Tier.', 'success');
  };

  // --- Checkout Success Handling ---
  const { refreshProfile, syncSubscription } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return; // Wait for AuthContext to initialize the token

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const finalizeCheckout = async () => {
        try {
          const result = await syncSubscription();
          if (result && (result as any).success) {
            addToast('Upgrade verified. Neural Pro features are now active.', 'success');
          } else {
            addToast('Upgrade pending. Try syncing from Billing settings.', 'warning');
          }
        } catch (error: any) {
          addToast(`Upgraded, but sync failed: ${error?.message}. Please check Billing & Plans settings.`, 'warning');
        }
        window.history.replaceState({}, '', window.location.pathname);
      };
      finalizeCheckout();
    }
    if (params.get('canceled') === 'true') {
      addToast('Upgrade process was minimized. Return anytime to complete your evolution.', 'warning');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated, addToast, syncSubscription]);

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for external theme changes (from SettingsView)
  useEffect(() => {
    const handleExternalChange = () => {
      const stored = localStorage.getItem('theme') as 'dark' | 'light' | 'midnight';
      if (stored && stored !== theme) {
        setTheme(stored);
      }
    };

    const handleNavigateToSettings = (e: any) => {
      openTab('settings', 'Settings', e.detail);
    };

    const handleForceReapply = () => {
      applyTheme(theme);
    };

    window.addEventListener('theme-change', handleExternalChange);
    window.addEventListener('navigate-to-settings', handleNavigateToSettings);
    window.addEventListener('force-theme-reapply', handleForceReapply);
    return () => {
      window.removeEventListener('theme-change', handleExternalChange);
      window.removeEventListener('navigate-to-settings', handleNavigateToSettings);
      window.removeEventListener('force-theme-reapply', handleForceReapply);
    };
  }, [theme]);

  // Pro Plan Attribute Injection
  useEffect(() => {
    if (user && (user.organization?.plan === 'pro' || (user as any).plan === 'pro')) {
      document.body.setAttribute('data-plan', 'pro');
    } else {
      document.body.removeAttribute('data-plan');
    }
  }, [user]);

  const applyTheme = (newTheme: 'dark' | 'light' | 'midnight') => {
    document.documentElement.setAttribute('data-theme', newTheme);
    // Clean up any previous custom theme overrides
    const customProps = [
      '--bg-main', '--bg-secondary', '--bg-card', '--bg-surface', '--bg-surface-hover',
      '--bg-sidebar', '--bg-header', '--bg-elevated',
      '--primary', '--primary-dark', '--primary-light', '--primary-glow', '--primary-subtle',
      '--accent', '--accent-light', '--accent-glow',
      '--secondary-accent', '--secondary-glow',
      '--text-primary', '--text-secondary', '--text-muted', '--text-tertiary', '--text-inverse', '--text-disabled',
      '--border-color', '--border-default', '--border-subtle', '--glass-border', '--border-glow', '--border-highlight',
      '--success', '--warning', '--danger', '--error', '--info',
      '--theme-blur', '--theme-saturation', '--theme-glow-intensity',
    ];
    customProps.forEach(p => document.documentElement.style.removeProperty(p));

    // Remove dynamic aurora if switching away
    const existingAurora = document.getElementById('dynamic-aurora-style');
    if (existingAurora) existingAurora.remove();

    // If custom theme, apply user's color overrides
    if (newTheme === 'midnight') {
      try {
        const customColors = JSON.parse(localStorage.getItem('custom-theme-colors') || '{}');
        if (customColors.primary) {
          const p = customColors.primary;
          const a = customColors.accent || p;
          const bg = customColors.bgMain || '#0d0a04';
          const text = customColors.textPrimary || '#fef3c7';
          const glowIntensity = customColors.glowIntensity ?? 50;
          const blurAmount = customColors.blurAmount ?? 28;

          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
          };

          // Derive lighter/darker variants
          const adjustBrightness = (hex: string, factor: number) => {
            const r = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * factor)));
            const g = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * factor)));
            const b = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * factor)));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          };

          const bgR = parseInt(bg.slice(1, 3), 16), bgG = parseInt(bg.slice(3, 5), 16), bgB = parseInt(bg.slice(5, 7), 16);
          const pRgb = hexToRgb(p);
          const aRgb = hexToRgb(a);
          const glowFactor = glowIntensity / 100;

          // Core palette
          document.documentElement.style.setProperty('--primary', p);
          document.documentElement.style.setProperty('--primary-dark', adjustBrightness(p, 0.8));
          document.documentElement.style.setProperty('--primary-light', adjustBrightness(p, 1.3));
          document.documentElement.style.setProperty('--primary-glow', `rgba(${pRgb}, ${0.45 * glowFactor})`);
          document.documentElement.style.setProperty('--primary-subtle', `rgba(${pRgb}, ${0.12 * glowFactor})`);
          document.documentElement.style.setProperty('--accent', a);
          document.documentElement.style.setProperty('--accent-light', adjustBrightness(a, 1.3));
          document.documentElement.style.setProperty('--accent-glow', `rgba(${aRgb}, ${0.4 * glowFactor})`);

          // Backgrounds — derive from bgMain
          document.documentElement.style.setProperty('--bg-main', bg);
          document.documentElement.style.setProperty('--bg-secondary', adjustBrightness(bg, 1.3));
          document.documentElement.style.setProperty('--bg-card', `rgba(${Math.min(255, bgR + 15)}, ${Math.min(255, bgG + 10)}, ${Math.min(255, bgB + 5)}, 0.7)`);
          document.documentElement.style.setProperty('--bg-surface', adjustBrightness(bg, 1.5));
          document.documentElement.style.setProperty('--bg-surface-hover', adjustBrightness(bg, 1.8));
          document.documentElement.style.setProperty('--bg-sidebar', `rgba(${bgR}, ${bgG}, ${bgB}, 0.92)`);
          document.documentElement.style.setProperty('--bg-header', `rgba(${bgR}, ${bgG}, ${bgB}, 0.85)`);
          document.documentElement.style.setProperty('--bg-elevated', `rgba(${Math.min(255, bgR + 20)}, ${Math.min(255, bgG + 14)}, ${Math.min(255, bgB + 7)}, 0.88)`);

          // Text
          document.documentElement.style.setProperty('--text-primary', text);
          const tR = parseInt(text.slice(1, 3), 16), tG = parseInt(text.slice(3, 5), 16), tB = parseInt(text.slice(5, 7), 16);
          document.documentElement.style.setProperty('--text-secondary', `rgba(${tR}, ${tG}, ${tB}, 0.72)`);
          document.documentElement.style.setProperty('--text-muted', `rgba(${tR}, ${tG}, ${tB}, 0.48)`);
          document.documentElement.style.setProperty('--text-tertiary', `rgba(${tR}, ${tG}, ${tB}, 0.32)`);

          // Borders
          document.documentElement.style.setProperty('--border-color', `rgba(${pRgb}, ${0.2 * glowFactor})`);
          document.documentElement.style.setProperty('--border-default', `rgba(${pRgb}, ${0.15 * glowFactor})`);
          document.documentElement.style.setProperty('--border-subtle', `rgba(${pRgb}, ${0.1 * glowFactor})`);
          document.documentElement.style.setProperty('--glass-border', `rgba(${pRgb}, ${0.06 * glowFactor})`);
          document.documentElement.style.setProperty('--border-glow', `rgba(${pRgb}, ${0.35 * glowFactor})`);

          // Theme-specific controls
          document.documentElement.style.setProperty('--theme-blur', `${blurAmount}px`);
          document.documentElement.style.setProperty('--theme-saturation', `${120 + blurAmount * 2}%`);

          // Dynamic Aurora — generate CSS keyframes matching user palette
          const auroraOpacity = (0.12 * glowFactor).toFixed(3);
          const auroraOpacity2 = (0.08 * glowFactor).toFixed(3);
          const auroraOpacity3 = (0.05 * glowFactor).toFixed(3);
          const styleEl = document.createElement('style');
          styleEl.id = 'dynamic-aurora-style';
          styleEl.textContent = `
            [data-theme='midnight'] body::before {
              content: '';
              position: fixed;
              inset: 0;
              z-index: 0;
              pointer-events: none;
              background:
                radial-gradient(ellipse 80% 60% at 10% 20%, rgba(${pRgb}, ${auroraOpacity}) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 85% 70%, rgba(${aRgb}, ${auroraOpacity2}) 0%, transparent 55%),
                radial-gradient(ellipse 70% 40% at 50% 90%, rgba(${pRgb}, ${auroraOpacity3}) 0%, transparent 50%),
                radial-gradient(ellipse 50% 50% at 70% 10%, rgba(${aRgb}, ${auroraOpacity3}) 0%, transparent 50%);
              animation: dynamic-aurora 18s ease-in-out infinite alternate;
            }
            @keyframes dynamic-aurora {
              0% {
                background:
                  radial-gradient(ellipse 80% 60% at 10% 20%, rgba(${pRgb}, ${auroraOpacity}) 0%, transparent 60%),
                  radial-gradient(ellipse 60% 50% at 85% 70%, rgba(${aRgb}, ${auroraOpacity2}) 0%, transparent 55%),
                  radial-gradient(ellipse 70% 40% at 50% 90%, rgba(${pRgb}, ${auroraOpacity3}) 0%, transparent 50%),
                  radial-gradient(ellipse 50% 50% at 70% 10%, rgba(${aRgb}, ${auroraOpacity3}) 0%, transparent 50%);
              }
              50% {
                background:
                  radial-gradient(ellipse 70% 50% at 50% 60%, rgba(${aRgb}, ${auroraOpacity}) 0%, transparent 55%),
                  radial-gradient(ellipse 50% 60% at 20% 20%, rgba(${pRgb}, ${auroraOpacity2}) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 40% at 80% 80%, rgba(${pRgb}, ${auroraOpacity3}) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 45% at 85% 30%, rgba(${aRgb}, ${auroraOpacity2}) 0%, transparent 55%);
              }
              100% {
                background:
                  radial-gradient(ellipse 75% 55% at 60% 40%, rgba(${pRgb}, ${auroraOpacity}) 0%, transparent 58%),
                  radial-gradient(ellipse 55% 55% at 10% 70%, rgba(${aRgb}, ${auroraOpacity2}) 0%, transparent 50%),
                  radial-gradient(ellipse 65% 45% at 90% 10%, rgba(${pRgb}, ${auroraOpacity3}) 0%, transparent 52%),
                  radial-gradient(ellipse 60% 50% at 35% 85%, rgba(${aRgb}, ${auroraOpacity2}) 0%, transparent 55%);
              }
            }
          `;
          document.head.appendChild(styleEl);
        }
      } catch (e) { /* use defaults from CSS */ }
    }
  };

  const handleThemeToggle = () => {
    const cycle: Array<'dark' | 'light' | 'midnight'> = ['dark', 'light', 'midnight'];
    const currentIdx = cycle.indexOf(theme);
    const newTheme = cycle[(currentIdx + 1) % cycle.length];
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
      // Silent fail - files will be empty array
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
      // Silent fail - groups will be empty array
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

  const handleUpload = async (filesOrFile: File[] | File) => {
    if (!token) {
      addToast('Please login to upload files', 'error');
      return;
    }

    const files = Array.isArray(filesOrFile) ? filesOrFile : [filesOrFile];
    if (files.length === 0) return;

    runAnalysisWithProgress(async () => {
      let successCount = 0;
      let lastAnalysisData = null;
      let lastFilename = '';

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`${API_URL}/api/files/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          throw new Error(`Upload failed for ${file.name}: ${errorText}`);
        }
        const { file: newFile } = await uploadRes.json();

        // Small delay to allow 'Validating' stage to feel real
        await new Promise(r => setTimeout(r, 1000));

        const analyzeRes = await fetch(`${API_URL}/api/files/${newFile.id}/analyze`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (analyzeRes.ok) {
          const analysisData = await analyzeRes.json();
          lastAnalysisData = analysisData;
          lastFilename = newFile.filename;
          successCount++;
        } else {
          const errorText = await analyzeRes.text();
          throw new Error(`Strategic analysis failed for ${file.name}: ${errorText}`);
        }
      }

      await fetchFiles();

      if (successCount === 1 && lastAnalysisData) {
        return { type: 'analysis', title: lastFilename, data: lastAnalysisData };
      }
    });
  };

  const handleBiFileUpload = async (file: File, type: string) => {
    if (!token) return;
    runAnalysisWithProgress(async () => {
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
      }
    });
  };

  const handleLoadDemo = async (type: string) => {
    runAnalysisWithProgress(async () => {
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
      }
    });
  };

  const handleAnalyzeFile = async (file: FileData) => {
    if (!token) {
      return;
    }

    runAnalysisWithProgress(async () => {
      const res = await fetch(`${API_URL}/api/files/${file.id}/analyze`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Neural analysis encountered a structural fault.');
      const data = await res.json();
      return { type: 'analysis', title: file.filename, data };
    });
  };

  const handleToggleFavorite = async (file: FileData) => {
    if (!token) return;

    // Optimistic Update
    const wasFavorite = !!file.isFavorite; // Boolean cast
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isFavorite: !wasFavorite } : f));

    try {
      const res = await fetch(`${API_URL}/api/files/${file.id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Favorite toggle failed:', errorText);
        throw new Error('Failed to update favorite');
      }
    } catch (e) {
      // Revert Optimistic Update
      console.error(e);
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isFavorite: wasFavorite } : f));
      addToast('Failed to update favorite status', 'error');
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
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : theme === 'light' ? 'Custom' : 'Dark'} Mode`, icon: <Palette size={18} />, action: handleThemeToggle, category: 'Appearance' },
    { id: 'simulation', label: 'Open Simulation Engine', icon: <LayoutDashboard size={18} />, action: () => openTab('simulation', 'Simulation Engine'), category: 'Navigation' },
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
  }, [openTab, logout, theme, handleThemeToggle]);

  // --- Render ---

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full" style={{ background: 'var(--bg-app)' }}>
        <div className="flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-h2 opacity-50">Authenticating...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        {authView === 'login' ? (
          <LoginView onSwitchToRegister={() => setAuthView('register')} onSuccess={() => { }} />
        ) : (
          <RegisterView onSwitchToLogin={() => setAuthView('login')} onSuccess={() => { }} />
        )}
      </Suspense>
    );
  }

  // Active Tab
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const currentViewType = activeTab?.type || 'dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {isPro && <ProBackdrop />}
      <div className="noise-overlay"></div>
      <Header
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={(path) => {
          if (path === 'settings') openTab('settings', 'Settings');
        }}
      />


      <RootLayout
        currentView={currentViewType}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        onViewChange={(viewInfo) => {
          const id = typeof viewInfo === 'string' ? viewInfo : viewInfo.id;
          const data = typeof viewInfo === 'string' ? undefined : viewInfo.data;

          const title = id === 'diff' ? 'Version Diff' :
            id === 'nexus' ? 'Nexus AI' :
              id === 'logistics' ? 'Road Intelligence' :
                id === 'agentic' ? 'Agentic Systems' :
                  id === 'democracy' ? 'Self-Service Studio' :
                    id.charAt(0).toUpperCase() + id.slice(1);
          openTab(id, title, data);
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
              <div key={tab.id} style={{ display: tab.id === activeTabId ? 'block' : 'none', height: '100%', position: 'relative' }}>

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
                    handleDrop={(e: any) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files.length > 0) handleUpload(Array.from(e.dataTransfer.files)); }}
                    onViewReport={() => openTab('projects', 'Strategic Board')}
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
                    userPlan={(user as any)?.organization?.plan || 'free'}
                    onUpgradeRequested={() => openTab('settings', 'Settings', { initialTab: 'subscription' })}
                  />
                )}

                {tab.type === 'migration' && (
                  <MigrationView onClose={() => openTab('dashboard', 'Dashboard')} />
                )}

                {tab.type === 'nexus' && (
                  <NexusView
                    files={files}
                    groups={groups}
                    token={token || ''}
                    userPlan={(user as any)?.organization?.plan || 'free'}
                    onProjectCreated={() => openTab('projects', 'Strategic Board')}
                    runWithProgress={runAnalysisWithProgress}
                  />
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
                  <SelfServiceStudio
                    files={files}
                    token={token || ''}
                    apiUrl={API_URL}
                    userPlan={(user as any)?.organization?.plan || 'free'}
                    runWithProgress={runAnalysisWithProgress}
                  />
                )}

                {tab.type === 'multi-analysis' && (
                  <MultiAnalysisView
                    userPlan={(user as any)?.organization?.plan || 'free'}
                    onClose={() => openTab('dashboard', 'Dashboard')}
                  />
                )}

                {tab.type === 'automation' && (
                  <AutomationView />
                )}

                {tab.type === 'organization' && (
                  <OrganizationView token={token || ''} />
                )}

                {tab.type === 'collaboration' && (
                  <CollaborationView token={token || ''} />
                )}

                {tab.type === 'diff' && (
                  <VersionDiffView
                    files={files}
                    token={token || ''}
                  />
                )}

                {tab.type === 'anomaly' && (
                  <AnomalyDetectionView
                    files={files}
                    token={token || ''}
                  />
                )}

                {tab.type === 'financial' && (
                  <FinancialRiskView
                    files={files}
                    token={token || ''}
                  />
                )}

                {tab.type === 'simulation' && (
                  <SimulationView
                    files={files}
                    token={token || ''}
                  />
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

      <ProcessingOverlay
        isVisible={isAnalyzing}
        stage={analysisStage}
        status={analysisStatus}
        errorDetails={analysisError}
        onViewResults={() => {
          if (lastWorkerResult) {
            openTab(lastWorkerResult.type as any, lastWorkerResult.title, lastWorkerResult.data);
          }
          setIsAnalyzing(false);
        }}
        onRetry={() => {
          setIsAnalyzing(false);
          addToast('Retry sequence initiated. Please re-trigger the action.', 'info');
        }}
        onClose={() => setIsAnalyzing(false)}
      />
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
