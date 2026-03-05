import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Calendar, Trash2, Edit2, Play, Check, X } from 'lucide-react';

interface Schedule {
    id: string;
    name: string;
    cronExpression: string;
    isActive: boolean;
    config: any;
    targetFileId?: string;
}

export const SchedulesTab = () => {
    const { addToast } = useToast();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newSchedule, setNewSchedule] = useState({ name: '', cronExpression: '0 0 * * *' });

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/automation/schedules');
            setSchedules(res.data);
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to fetch schedules', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const createSchedule = async () => {
        try {
            const res = await api.post('/automation/schedules', newSchedule);
            setSchedules([...schedules, res.data]);
            setIsCreating(false);
            setNewSchedule({ name: '', cronExpression: '0 0 * * *' });
            addToast('Schedule created successfully', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to create schedule', 'error');
        }
    };

    const deleteSchedule = async (id: string) => {
        try {
            await api.delete(`/automation/schedules/${id}`);
            setSchedules(schedules.filter(s => s.id !== id));
            addToast('Schedule deleted', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to delete schedule', 'error');
        }
    };

    const toggleStatus = async (schedule: Schedule) => {
        try {
            const res = await api.put(`/automation/schedules/${schedule.id}`, { isActive: !schedule.isActive });
            setSchedules(schedules.map(s => s.id === schedule.id ? res.data : s));
        } catch (e: any) {
            addToast('Failed to toggle status', 'error');
        }
    };

    if (isLoading) return <div className="text-secondary p-6">Loading schedules...</div>;

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative max-h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="text-emerald-500" />
                    Configured Schedules
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-glow-emerald"
                >
                    Add Schedule
                </button>
            </div>

            {isCreating && (
                <div className="card border border-emerald-500/30 p-4 mb-4 bg-emerald-500/5">
                    <h3 className="font-bold mb-3">New Schedule</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Schedule Name"
                            value={newSchedule.name}
                            onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })}
                            className="input bg-black/20 font-medium"
                        />
                        <input
                            type="text"
                            placeholder="Cron Expression (e.g. 0 0 * * *)"
                            value={newSchedule.cronExpression}
                            onChange={e => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}
                            className="input bg-black/20 font-mono text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={createSchedule} className="btn bg-emerald-500 text-white font-bold">Save</button>
                        <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {schedules.length === 0 && !isCreating && (
                    <div className="p-8 text-center text-secondary border border-dashed border-[var(--border-default)] rounded-xl">
                        No schedules found. Create one to get started.
                    </div>
                )}
                {schedules.map(schedule => (
                    <div key={schedule.id} className="card p-4 flex items-center justify-between border border-[var(--border-subtle)] hover:border-emerald-500/30 transition-colors">
                        <div>
                            <div className="font-bold flex items-center gap-2">
                                {schedule.name}
                                {schedule.isActive ? (
                                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">Active</span>
                                ) : (
                                    <span className="bg-white/10 text-secondary text-xs px-2 py-0.5 rounded-full border border-white/10">Paused</span>
                                )}
                            </div>
                            <div className="text-xs text-secondary mt-1 font-mono">
                                CRON: {schedule.cronExpression}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleStatus(schedule)}
                                className={`btn btn-sm ${schedule.isActive ? 'btn-secondary' : 'bg-emerald-500/20 text-emerald-400'}`}
                                title={schedule.isActive ? "Pause Schedule" : "Resume Schedule"}
                            >
                                {schedule.isActive ? <Play size={14} className="rotate-90" /> : <Play size={14} />}
                            </button>
                            <button onClick={() => deleteSchedule(schedule.id)} className="btn btn-icon text-rose-500 hover:bg-rose-500/20">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
