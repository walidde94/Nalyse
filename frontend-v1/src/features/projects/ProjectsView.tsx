import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/ui/Toast';

interface Project {
    id: string;
    title: string;
    description: string;
    objective: string;
    actions: string[];
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    impact?: string;
    createdAt: string;
}

import { API_URL } from '../../config';

export const ProjectsView = ({ token }: { token: string }) => {
    const { addToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            addToast('Failed to load projects', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, addToast]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchProjects();
                addToast('Status updated', 'success');
            }
        } catch (error) {
            addToast('Update failed', 'error');
        }
    };

    const deleteProject = async (id: string) => {
        if (!confirm('Archive this project?')) return;
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setProjects(projects.filter(p => p.id !== id));
                addToast('Project archived', 'success');
            }
        } catch (error) {
            addToast('Delete failed', 'error');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20 h-full w-full">
            <div className="flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-h3 text-sec animate-pulse">Loading Agile Board...</div>
            </div>
        </div>
    );

    const activeProjects = projects.filter(p => p.status === 'active');
    const onHoldProjects = projects.filter(p => p.status === 'on_hold');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const cancelledProjects = projects.filter(p => p.status === 'cancelled');

    const ColumnHeader = ({ title, count, color }: { title: string, count: number, color: string }) => (
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-subtle">
            <h3 className="text-h3 flex items-center gap-3">
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: color, boxShadow: `0 0 10px ${color}80` }}></span>
                {title}
            </h3>
            <span className="bg-bg-surface px-3 py-1 rounded-full text-xs font-bold text-sec">{count}</span>
        </div>
    );

    const ProjectCard = ({ project, color }: { project: Project, color: string }) => (
        <div
            className="card p-6 glass-card agile-card flex-col gap-4 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ borderTop: `4px solid ${color}` }}
        >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-20" style={{ background: color }}></div>

            <div className="flex justify-between items-start">
                <div className="flex-col gap-1 z-10">
                    <span
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded"
                        style={{ color: color, background: `${color}15`, width: 'fit-content' }}
                    >
                        {project.objective.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-bold text-lg mt-2 leading-tight">{project.title}</h4>
                </div>
            </div>

            <p className="text-sm text-sec line-clamp-3">{project.description}</p>

            {project.actions && project.actions.length > 0 && (
                <div className="flex-col gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase text-tertiary">Next Actions</span>
                    <div className="flex-col gap-1.5">
                        {project.actions.slice(0, 2).map((a, i) => (
                            <div key={i} className="flex gap-2 items-start text-xs p-2 rounded bg-bg-surface bg-opacity-50">
                                <span style={{ color: color, fontWeight: 900, fontSize: '10px', marginTop: '2px' }}>●</span>
                                <span className="text-sec leading-snug">{a}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pt-4 mt-2 border-t border-subtle z-10">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {project.status !== 'active' && <button className="btn btn-ghost btn-sm text-[10px] px-2" onClick={() => updateStatus(project.id, 'active')}>Resume</button>}
                    {project.status === 'active' && <button className="btn btn-ghost btn-sm text-[10px] px-2 text-warning" onClick={() => updateStatus(project.id, 'on_hold')}>Hold</button>}
                    {project.status !== 'completed' && <button className="btn btn-ghost btn-sm text-[10px] px-2 text-success" onClick={() => updateStatus(project.id, 'completed')}>Done</button>}
                    <button className="btn btn-ghost btn-sm text-[10px] px-2 text-danger hover:bg-danger hover:text-white" onClick={() => deleteProject(project.id)}>DEL</button>
                </div>
                {project.impact && (
                    <span className="text-xs font-bold" style={{ color: color }}>
                        {project.impact}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-col gap-8 fade-in h-full" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <div className="flex justify-between items-end mb-4">
                <div className="flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-h1" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>Agile Hub</h1>
                        <span className="px-3 py-1 rounded bg-primary-subtle text-primary text-xs font-bold uppercase tracking-widest border border-primary border-opacity-20">Strategic Execution</span>
                    </div>
                    <p className="text-sec text-lg max-w-2xl">Manage autonomous initiatives and human-in-the-loop directives across all neural pipelines.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost flex items-center gap-2">
                        <span className="text-xl">⚙️</span> Board Settings
                    </button>
                    <button className="btn btn-primary flex items-center gap-2" style={{ boxShadow: '0 4px 15px var(--primary-subtle)' }}>
                        <span className="text-xl">+</span> New Initiative
                    </button>
                </div>
            </div>

            <div className="agile-board grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start h-full pb-10" style={{ alignItems: 'stretch' }}>

                {/* Active Column */}
                <div className="flex-col gap-4 bg-bg-card bg-opacity-30 rounded-2xl p-4 border border-subtle relative min-h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] to-transparent opacity-[0.02] rounded-2xl pointer-events-none"></div>
                    <ColumnHeader title="In Execution" count={activeProjects.length} color="var(--primary)" />
                    <div className="flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {activeProjects.map(project => (
                            <ProjectCard key={project.id} project={project} color="var(--primary)" />
                        ))}
                        {activeProjects.length === 0 && (
                            <div className="p-8 text-center text-sec opacity-60 border-2 border-dashed border-subtle rounded-xl flex-col gap-3 items-center">
                                <span className="text-3xl opacity-50">🚀</span>
                                <span>No active initiatives.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* On Hold Column */}
                <div className="flex-col gap-4 bg-bg-card bg-opacity-30 rounded-2xl p-4 border border-subtle relative min-h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--warning)] to-transparent opacity-[0.02] rounded-2xl pointer-events-none"></div>
                    <ColumnHeader title="On Hold" count={onHoldProjects.length} color="var(--warning)" />
                    <div className="flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {onHoldProjects.map(project => (
                            <ProjectCard key={project.id} project={project} color="var(--warning)" />
                        ))}
                        {onHoldProjects.length === 0 && (
                            <div className="p-8 text-center text-sec opacity-60 border-2 border-dashed border-subtle rounded-xl">
                                <span>Clear pipeline.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed Column */}
                <div className="flex-col gap-4 bg-bg-card bg-opacity-30 rounded-2xl p-4 border border-subtle relative min-h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--success)] to-transparent opacity-[0.02] rounded-2xl pointer-events-none"></div>
                    <ColumnHeader title="Value Realized" count={completedProjects.length} color="var(--success)" />
                    <div className="flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {completedProjects.map(project => (
                            <ProjectCard key={project.id} project={project} color="var(--success)" />
                        ))}
                    </div>
                </div>

                {/* Cancelled Column */}
                <div className="flex-col gap-4 bg-bg-card bg-opacity-30 rounded-2xl p-4 border border-subtle relative min-h-[600px] opacity-70 hover:opacity-100 transition-opacity">
                    <ColumnHeader title="Cancelled" count={cancelledProjects.length} color="var(--text-tertiary)" />
                    <div className="flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {cancelledProjects.map(project => (
                            <ProjectCard key={project.id} project={project} color="var(--text-tertiary)" />
                        ))}
                    </div>
                </div>

            </div>

            <style>{`
                .glass-card { 
                    background: rgba(var(--bg-app-rgb), 0.7); 
                    backdrop-filter: blur(12px); 
                    border: 1px solid var(--border-subtle);
                }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .agile-board::-webkit-scrollbar { display: none; }
                .agile-card {
                    transform: translateY(0);
                }
                .btn-ghost:hover {
                    background: var(--bg-surface-hover);
                }
            `}</style>
        </div>
    );
};
