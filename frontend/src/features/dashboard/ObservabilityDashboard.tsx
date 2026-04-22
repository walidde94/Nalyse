import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { X, Activity, Server, Database, Cpu, HardDrive, Wifi, ShieldCheck, Play, Pause } from 'lucide-react';
import { API_URL } from '../../config';

// ═══════════════════════════════════════════════════════════════════
// OBSERVABILITY DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export const ObservabilityDashboard = ({ onClose, token }: { onClose: () => void, token: string }) => {
    const [data, setData] = useState<any[]>([]);
    const [isLive, setIsLive] = useState(true);
    const MAX_POINTS = 60; // Keep last 60 seconds

    // Initialize with some empty data to make chart look good on load
    useEffect(() => {
        const initialData = [];
        const now = new Date().getTime();
        for (let i = MAX_POINTS; i >= 0; i--) {
            initialData.push({
                time: new Date(now - i * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                timestamp: now - i * 1000,
                'nalyse-backend-cpu': 0,
                'nalyse-db-cpu': 0,
                'nalyse-backend-mem': 120,
                'nalyse-db-mem': 30,
                'nalyse-backend-net': 0,
                'nalyse-db-net': 0,
                'nalyse-backend-disk': 2.1,
                'nalyse-db-disk': 25.4,
            });
        }
        setData(initialData);
    }, []);

    // Fetch real-time data from backend
    useEffect(() => {
        if (!isLive) return;

        let interval: any;

        const fetchMetrics = async () => {
            try {
                // If backend endpoint is available, fetch it. Otherwise fallback to local sim.
                const res = await fetch(`${API_URL}/api/pulse/observability`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const metrics = await res.json();
                    
                    setData(prev => {
                        const newPoint = {
                            time: new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            timestamp: new Date(metrics.timestamp).getTime(),
                            'nalyse-backend-cpu': metrics.services['nalyse-backend'].cpu,
                            'nalyse-db-cpu': metrics.services['nalyse-db'].cpu,
                            'nalyse-backend-mem': metrics.services['nalyse-backend'].memory,
                            'nalyse-db-mem': metrics.services['nalyse-db'].memory,
                            'nalyse-backend-net': metrics.services['nalyse-backend'].networkEgress,
                            'nalyse-db-net': metrics.services['nalyse-db'].networkEgress,
                            'nalyse-backend-disk': metrics.services['nalyse-backend'].diskUsage,
                            'nalyse-db-disk': metrics.services['nalyse-db'].diskUsage,
                        };
                        const next = [...prev, newPoint];
                        if (next.length > MAX_POINTS) next.shift();
                        return next;
                    });
                }
            } catch (error) {
                console.error("Failed to fetch observability metrics", error);
            }
        };

        fetchMetrics();
        interval = setInterval(fetchMetrics, 2000); // 2 second interval

        return () => clearInterval(interval);
    }, [isLive, token]);


    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)',
                    fontFamily: 'var(--font-mono)'
                }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>{label}</div>
                    {payload.map((p: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{p.name}</span>
                            </div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{Number(p.value).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = (title: string, dataKeys: any[], unit: string) => (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '320px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ 
                    fontSize: '11px', 
                    fontWeight: 900, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.15em',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                }}>
                    {title === 'CPU usage' && <Cpu size={14} style={{ color: '#3b82f6' }} />}
                    {title === 'Memory usage' && <Activity size={14} style={{ color: '#10b981' }} />}
                    {title === 'Network egress' && <Wifi size={14} style={{ color: '#a855f7' }} />}
                    {title === 'Disk usage' && <HardDrive size={14} style={{ color: '#f59e0b' }} />}
                    {title}
                </h3>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="time" 
                            stroke="rgba(255,255,255,0.2)" 
                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
                            axisLine={false} 
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.2)" 
                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(v) => `${v} ${unit}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
                        <Legend 
                            wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                            iconType="circle"
                            iconSize={8}
                        />
                        {dataKeys.map((dk, i) => (
                            <Line 
                                key={dk.key}
                                type="stepAfter" 
                                dataKey={dk.key} 
                                name={dk.name}
                                stroke={dk.color} 
                                strokeWidth={2} 
                                dot={false} 
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{
                height: '64px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                background: 'rgba(10, 10, 15, 0.8)',
                backdropFilter: 'blur(20px)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
                        <Activity size={16} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Production Observability</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)', borderRadius: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>Environment Active</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={() => setIsLive(!isLive)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: isLive ? '#10b981' : 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        {isLive ? <Pause size={14} /> : <Play size={14} />}
                        {isLive ? 'Pause Live Data' : 'Resume Live Data'}
                    </button>
                    <div style={{ width: '1px', height: '24px', background: 'var(--bg-elevated)' }} />
                    <button 
                        onClick={onClose}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
                alignContent: 'start'
            }}>
                {renderChart('CPU usage', [
                    { key: 'nalyse-db-cpu', name: 'nalyse-db', color: '#10b981' },
                    { key: 'nalyse-backend-cpu', name: 'nalyse-backend', color: '#0ea5e9' }
                ], 'vCPU')}
                
                {renderChart('Memory usage', [
                    { key: 'nalyse-db-mem', name: 'nalyse-db', color: '#10b981' },
                    { key: 'nalyse-backend-mem', name: 'nalyse-backend', color: '#0ea5e9' }
                ], 'MB')}

                {renderChart('Network egress', [
                    { key: 'nalyse-db-net', name: 'nalyse-db', color: '#10b981' },
                    { key: 'nalyse-backend-net', name: 'nalyse-backend', color: '#0ea5e9' }
                ], 'MB')}

                {renderChart('Disk usage', [
                    { key: 'nalyse-db-disk', name: 'nalyse-db', color: '#10b981' },
                    { key: 'nalyse-backend-disk', name: 'nalyse-backend', color: '#0ea5e9' }
                ], 'GB')}
            </div>
        </motion.div>
    );
};
