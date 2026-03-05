import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { BellRing, Trash2, Edit2, Play, Check, X, Bell } from 'lucide-react';

interface AlertRule {
    id: string;
    name: string;
    description?: string;
    metric: string;
    operator: string;
    threshold: number;
    actions: any;
    isActive: boolean;
}

export const AlertsTab = () => {
    const { addToast } = useToast();
    const [alerts, setAlerts] = useState<AlertRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newAlert, setNewAlert] = useState({ name: '', metric: 'latency', operator: 'gt', threshold: 1000, description: '' });

    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/automation/alerts');
            setAlerts(res.data);
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to fetch alerts', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const createAlert = async () => {
        try {
            if (!newAlert.name || !newAlert.metric) {
                addToast('Name and Metric are required', 'error');
                return;
            }
            const res = await api.post('/automation/alerts', newAlert);
            setAlerts([...alerts, res.data]);
            setIsCreating(false);
            setNewAlert({ name: '', metric: 'latency', operator: 'gt', threshold: 1000, description: '' });
            addToast('Alert created successfully', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to create alert rule', 'error');
        }
    };

    const deleteAlert = async (id: string) => {
        try {
            await api.delete(`/automation/alerts/${id}`);
            setAlerts(alerts.filter(a => a.id !== id));
            addToast('Alert deleted', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to delete alert rule', 'error');
        }
    };

    const toggleStatus = async (alert: AlertRule) => {
        addToast('Toggle feature requires backend PUT endpoint implementaton in Sprint 7', 'warning');
    };

    if (isLoading) return <div className="text-secondary p-6">Loading alerts...</div>;

    const opMap: Record<string, string> = {
        'gt': '>',
        'lt': '<',
        'eq': '=',
        'gte': '>=',
        'lte': '<='
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative max-h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <BellRing className="text-indigo-500" />
                    Threshold Alerts
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary bg-indigo-600 hover:bg-indigo-500 shadow-glow-indigo text-white font-bold"
                >
                    Add Alert
                </button>
            </div>

            {isCreating && (
                <div className="card border border-indigo-500/30 p-4 mb-4 bg-indigo-500/5">
                    <h3 className="font-bold mb-3">Create Alert Rule</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Rule Name (e.g. High Latency Drop)"
                            value={newAlert.name}
                            onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                            className="input bg-black/20 font-medium"
                        />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Metric (e.g. cpu_usage)"
                                value={newAlert.metric}
                                onChange={e => setNewAlert({ ...newAlert, metric: e.target.value })}
                                className="input flex-1 bg-black/20 text-sm"
                            />
                            <select
                                className="input w-20 bg-black/20 text-sm py-0"
                                value={newAlert.operator}
                                onChange={e => setNewAlert({ ...newAlert, operator: e.target.value })}
                            >
                                <option value="gt">&gt;</option>
                                <option value="lt">&lt;</option>
                                <option value="eq">=</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Threshold"
                                value={newAlert.threshold}
                                onChange={e => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                                className="input flex-1 bg-black/20 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={createAlert} className="btn bg-indigo-500 text-white font-bold">Arm Rule</button>
                        <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {alerts.length === 0 && !isCreating && (
                    <div className="p-8 text-center text-secondary border border-dashed border-[var(--border-default)] rounded-xl">
                        No alert rules configured. Create one to automatically monitor pipeline status.
                    </div>
                )}
                {alerts.map(alert => (
                    <div key={alert.id} className="card p-4 flex items-center justify-between border border-[var(--border-subtle)] hover:border-indigo-500/30 transition-colors">
                        <div>
                            <div className="font-bold flex items-center gap-2">
                                {alert.name}
                                {alert.isActive ? (
                                    <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">Active</span>
                                ) : (
                                    <span className="bg-white/10 text-secondary text-xs px-2 py-0.5 rounded-full border border-white/10">Disabled</span>
                                )}
                            </div>
                            <div className="text-xs text-secondary flex items-center gap-2 mt-2">
                                <span className="bg-black/30 px-2 py-1 rounded font-mono text-indigo-300">IF</span>
                                <span className="bg-black/30 px-2 py-1 rounded font-mono">{alert.metric}</span>
                                <span className="bg-black/30 px-2 py-1 rounded font-mono">{opMap[alert.operator] || alert.operator}</span>
                                <span className="bg-black/30 px-2 py-1 rounded font-mono text-rose-300">{alert.threshold}</span>
                                <span className="bg-black/30 px-2 py-1 rounded font-mono text-emerald-300 ml-2 border border-emerald-500/30">THEN FIRE ACTION</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => deleteAlert(alert.id)} className="btn btn-icon text-rose-500 hover:bg-rose-500/20">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
