import { useState, useCallback, useEffect } from 'react';
import { Zap, RefreshCw, Plus, Layers, Clock, Wand2, History, FileCode, Settings2, Search } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { AUTOMATION_STYLES } from './AutomationComponents';
import { CommandCenterTab } from './tabs/CommandCenterTab';
import { PipelinesTab } from './tabs/PipelinesTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { ExecutionLogTab } from './tabs/ExecutionLogTab';
import { ReportGalleryTab } from './tabs/ReportGalleryTab';
import { SettingsTab } from './tabs/SettingsTab';

type TabId = 'command' | 'pipelines' | 'templates' | 'history' | 'reports' | 'settings';

export const AutomationView = () => {
    const { addToast } = useToast();
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('command');
    const [loading, setLoading] = useState(false);

    const [schedules, setSchedules] = useState<any[]>([]);
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [globalHistory, setGlobalHistory] = useState<any[]>([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyFilters, setHistoryFilters] = useState<any>({});

    const fetchData = useCallback(async (hFilters?: any) => {
        try {
            const f = hFilters || historyFilters;
            const hParams = new URLSearchParams();
            if (f.status && f.status !== 'all') hParams.set('status', f.status);
            if (f.scheduleId) hParams.set('scheduleId', f.scheduleId);
            if (f.page) hParams.set('page', f.page.toString());
            hParams.set('limit', '50');

            const [sRes, dRes, aRes, stRes, hRes] = await Promise.all([
                fetch(`${API_URL}/api/automation/schedules`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/dashboards`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/automation/analyses`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/automation/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/automation/history?${hParams}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (sRes.ok) setSchedules(await sRes.json());
            if (dRes.ok) setDashboards(await dRes.json());
            if (aRes.ok) setAnalyses(await aRes.json());
            if (stRes.ok) setStats(await stRes.json());
            if (hRes.ok) {
                const hData = await hRes.json();
                if (hData.runs) {
                    setGlobalHistory(hData.runs);
                    setHistoryTotal(hData.total);
                    setHistoryPage(hData.page);
                } else {
                    setGlobalHistory(Array.isArray(hData) ? hData : []);
                }
            }
        } catch { console.error('Failed to load automation data'); }
    }, [token, historyFilters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Live Heartbeat: Refresh stats every 30s, or every 3s if reports are generating
    useEffect(() => {
        const hasPending = globalHistory.some(h => h.status === 'pending' || h.status === 'running');
        const intervalTime = hasPending ? 3000 : 30000;
        
        const interval = setInterval(() => fetchData(), intervalTime);
        return () => clearInterval(interval);
    }, [activeTab, fetchData, globalHistory]);

    const handleCreate = async (data: any) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/automation/schedules`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (res.ok) { addToast('Pipeline created', 'success'); fetchData(); }
        } catch { addToast('Creation failed', 'error'); }
        setLoading(false);
    };

    const handleTrigger = async (id: string) => {
        addToast('Triggering execution...', 'info');
        try {
            const opt = { id: 'temp-' + Date.now(), scheduleId: id, status: 'pending', startedAt: new Date().toISOString(), schedule: schedules.find(s => s.id === id) || { name: 'Report' } };
            setGlobalHistory(prev => [opt, ...prev]);
            const res = await fetch(`${API_URL}/api/automation/schedules/${id}/trigger`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                addToast('Execution started', 'success');
                let attempts = 0;
                const interval = setInterval(async () => { await fetchData(); attempts++; if (attempts >= 10) clearInterval(interval); }, 3000);
            } else { fetchData(); }
        } catch { addToast('Trigger failed', 'error'); fetchData(); }
    };

    const handleToggle = async (id: string, active: boolean) => {
        try {
            await fetch(`${API_URL}/api/automation/schedules/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: !active }) });
            fetchData();
        } catch {}
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this pipeline?')) return;
        try {
            await fetch(`${API_URL}/api/automation/schedules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            addToast('Pipeline deleted', 'success'); fetchData();
        } catch {}
    };

    const handleDuplicate = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/automation/schedules/${id}/duplicate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { addToast('Pipeline duplicated', 'success'); fetchData(); }
        } catch { addToast('Duplicate failed', 'error'); }
    };

    const handleDeleteReport = async (id: string) => {
        if (!confirm('Delete this report?')) return;
        try {
            await fetch(`${API_URL}/api/automation/reports/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            addToast('Report deleted', 'success'); fetchData();
        } catch {}
    };

    const handleRetry = async (scheduleId: string) => {
        try {
            await fetch(`${API_URL}/api/automation/schedules/${scheduleId}/retry-last`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            addToast('Retry initiated', 'info'); fetchData();
        } catch {}
    };

    const handleBulk = async (action: string) => {
        const activeIds = schedules.filter(s => s.isActive).map(s => s.id);
        if (!activeIds.length) return;
        try {
            await fetch(`${API_URL}/api/automation/schedules/bulk-action`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: activeIds, action }) });
            addToast(`Bulk ${action} complete`, 'success'); fetchData();
        } catch {}
    };

    const handleView = (run: any) => {
        if (!run.id) return;
        // Open the authenticated preview in a new tab with the token for auth
        const previewUrl = `${API_URL}/api/automation/reports/${run.id}/preview?token=${token}`;
        window.open(previewUrl, '_blank');
    };

    const handleShare = (run: any) => {
        if (!run.id) return;
        const previewUrl = `${API_URL}/api/automation/reports/${run.id}/preview?token=${token}`;
        navigator.clipboard.writeText(previewUrl);
        addToast('Preview link copied to clipboard', 'success');
    };

    const handleDownload = async (runId: string) => {
        try {
            const r = await fetch(`${API_URL}/api/automation/reports/${runId}/download`, { headers: { Authorization: `Bearer ${token}` } });
            if (!r.ok) throw new Error();
            const blob = await r.blob(); const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `Nalyse_Report_${runId.substring(0, 8)}.html`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
        } catch { addToast('Download failed', 'error'); }
    };

    const handleHistoryFilter = (f: any) => { setHistoryFilters(f); fetchData(f); };

    const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'command', label: 'Command Center', icon: <Layers size={16} /> },
        { id: 'pipelines', label: 'Pipelines', icon: <Clock size={16} /> },
        { id: 'templates', label: 'Templates', icon: <Wand2 size={16} /> },
        { id: 'history', label: 'Execution Log', icon: <History size={16} /> },
        { id: 'reports', label: 'Report Gallery', icon: <FileCode size={16} /> },
        { id: 'settings', label: 'Settings', icon: <Settings2 size={16} /> },
    ];

    const [searchQuery, setSearchQuery] = useState('');

    const filteredSchedules = schedules.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.config?.description || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredHistory = globalHistory.filter(h => (h.schedule?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 40px)', background: 'var(--bg-app)', position: 'relative' }}>
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '40vw', height: '40vh', background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

            <div className="fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px -6px rgba(99,102,241,0.4)' }}>
                            <Zap size={26} style={{ color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Automated Reporting</h1>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '3px 0 0', fontWeight: 500 }}>AI Orchestration for Enterprise Data Distribution</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: 220, padding: '10px 16px 10px 38px', borderRadius: 12, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
                            <div style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-disabled)' }}><Search size={14} /></div>
                        </div>
                        <button className="glass-button" style={{ padding: '9px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700 }} onClick={() => fetchData()}><RefreshCw size={14} /> Sync</button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: 'var(--bg-surface)', padding: 5, borderRadius: 14, width: 'fit-content', border: '1px solid var(--border-default)', flexWrap: 'wrap' }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className="auto-tab"
                            style={{ background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'command' && <CommandCenterTab stats={stats} schedules={schedules} globalHistory={globalHistory} onTriggerAll={() => handleBulk('trigger')} onPauseAll={() => handleBulk('pause')} />}
                {activeTab === 'pipelines' && <PipelinesTab schedules={filteredSchedules} dashboards={dashboards} analyses={analyses} loading={loading} onTrigger={handleTrigger} onToggle={handleToggle} onDelete={handleDelete} onDuplicate={handleDuplicate} onCreate={handleCreate} />}
                {activeTab === 'templates' && <TemplatesTab onDeployed={fetchData} />}
                {activeTab === 'history' && <ExecutionLogTab history={filteredHistory} schedules={schedules} total={historyTotal} page={historyPage} limit={50} onFilterChange={handleHistoryFilter} onRetry={handleRetry} onView={handleView} onDownload={handleDownload} />}
                {activeTab === 'reports' && <ReportGalleryTab history={filteredHistory} onView={handleView} onShare={handleShare} onDownload={handleDownload} onDelete={handleDeleteReport} onGoSchedules={() => setActiveTab('pipelines')} onTriggerFirst={() => schedules[0] && handleTrigger(schedules[0].id)} hasSchedules={schedules.length > 0} />}
                {activeTab === 'settings' && <SettingsTab />}
            </div>

            <style>{AUTOMATION_STYLES}</style>
        </div>
    );
};
