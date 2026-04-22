import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Play, Pause, Download, Zap, Timer, FileText, HardDrive } from 'lucide-react';
import { StatCard, ScoreRing } from '../AutomationComponents';

export const CommandCenterTab = ({ stats, schedules, globalHistory, onTriggerAll, onPauseAll }: any) => {
    const statsCards = useMemo(() => [
        { label: 'Success Rate', value: `${stats?.successRate || 100}%`, trend: '+0.1%', up: true, data: [65,78,72,85,92,88,98], color: '#10b981' },
        { label: 'Active Pipelines', value: (stats?.activeSchedules || 0).toString(), trend: '+1', up: true, data: [2,3,3,4,5,5, schedules.length], color: '#6366f1' },
        { label: 'Executions (24h)', value: (stats?.totalExecutions || 0).toString(), trend: '+12%', up: true, data: [10,15,12,18,22,25], color: '#f59e0b' },
        { label: 'Avg Duration', value: `${stats?.avgDuration || 0}ms`, trend: '-8%', up: true, data: [400,350,380,320,280,260], color: '#8b5cf6' },
        { label: 'Reports Generated', value: (stats?.totalReports || 0).toString(), trend: '+5', up: true, data: [3,5,4,8,10,12], color: '#06b6d4' },
        { label: 'Failed Deliveries', value: (stats?.failedDeliveries || 0).toString(), trend: '-100%', up: false, data: [2,1,0,0,0,0], color: '#ef4444' },
    ], [stats, schedules]);

    const chartData = useMemo(() => stats?.chartData || [
        { time: '00:00', success: 0, failed: 0 }, { time: '04:00', success: 0, failed: 0 },
        { time: '08:00', success: 0, failed: 0 }, { time: '12:00', success: 0, failed: 0 },
        { time: '16:00', success: 0, failed: 0 }, { time: '20:00', success: 0, failed: 0 },
    ], [stats]);

    const recentRuns = globalHistory.slice(0, 5);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <button className="glass-button" style={{ padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }} onClick={onTriggerAll}>
                    <Play size={14} /> Run All Active
                </button>
                <button className="glass-button" style={{ padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }} onClick={onPauseAll}>
                    <Pause size={14} /> Pause All
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
                {statsCards.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Chart + Ring + Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div className="glass-panel" style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border-default)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <LineChart size={18} style={{ color: '#10b981' }} /> Delivery Performance
                    </h3>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="cS" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="cF" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                                <XAxis dataKey="time" stroke='var(--text-disabled)' tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} />
                                <YAxis stroke='var(--text-disabled)' tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: 11 }} />
                                <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#cS)" />
                                <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#cF)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="glass-panel" style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <ScoreRing value={parseFloat(stats?.successRate || '100')} label="Reliability" size={140} stroke={10} />
                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '5px 12px', background: 'rgba(52,211,153,0.1)', borderRadius: 16 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                                <span style={{ fontSize: 10, color: '#10b981', fontWeight: 800 }}>Engine Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-default)', flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Recent Activity</div>
                        {recentRuns.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-disabled)', textAlign: 'center', padding: 20 }}>No activity yet</div>}
                        {recentRuns.map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.status === 'success' ? '#10b981' : r.status === 'failed' ? '#ef4444' : '#6366f1' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.schedule?.name || 'Run'}</div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{new Date(r.startedAt).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
