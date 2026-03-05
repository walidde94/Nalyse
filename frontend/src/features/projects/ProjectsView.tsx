import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useToast } from '../../components/ui/Toast';
import {
    Target, Rocket, CheckCircle2, Archive, Clock, TrendingUp,
    Zap, ChevronRight, Sparkles, ArrowUpRight, BarChart3,
    Calendar, Filter, LayoutGrid, List, MoreHorizontal,
    Eye, Trash2, Play, Pause, RefreshCw, GripVertical,
    Layers, Trophy, Flag, AlertCircle, ChevronDown
} from 'lucide-react';

import { API_URL } from '../../config';

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

/* ─── Animated Counters ─── */
const AnimatedNumber = ({ value, duration = 800 }: { value: number; duration?: number }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(value / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <span>{display}</span>;
};

/* ─── Floating Particles Background ─── */
const StrategicParticles = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }[] = [];
        for (let i = 0; i < 35; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.3 + 0.05,
                hue: Math.random() * 60 + 200
            });
        }

        let animId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
                ctx.fill();
            });

            // Connect nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `hsla(220, 80%, 60%, ${0.04 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 0, opacity: 0.6
            }}
        />
    );
};

/* ─── Progress Ring ─── */
const ProgressRing = ({ progress, size = 44, strokeWidth = 3, color = 'var(--primary)' }: {
    progress: number; size?: number; strokeWidth?: number; color?: string;
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="var(--border-subtle)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
        </svg>
    );
};

/* ─── Objective Badge ─── */
const ObjectiveBadge = ({ objective }: { objective: string }) => {
    const config: Record<string, { icon: any; gradient: string; label: string }> = {
        cost_reduction: { icon: TrendingUp, gradient: 'linear-gradient(135deg, #10b981, #059669)', label: 'Cost Reduction' },
        revenue_growth: { icon: Rocket, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', label: 'Revenue Growth' },
        risk_mitigation: { icon: AlertCircle, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', label: 'Risk Mitigation' },
        efficiency: { icon: Zap, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', label: 'Efficiency' },
        default: { icon: Target, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', label: objective.replace(/_/g, ' ') }
    };
    const { icon: Icon, gradient, label } = config[objective] || config.default;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '20px',
            background: gradient, fontSize: '10px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
            <Icon size={10} />
            {label}
        </div>
    );
};

/* ─── Action Progress Item ─── */
const ActionItem = ({ action, index, total }: { action: string; index: number; total: number }) => {
    const progress = Math.min(100, Math.round(((index + 1) / total) * 100 * (0.3 + Math.random() * 0.7)));
    return (
        <div className="sb-action-item" style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: '10px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            transition: 'all 0.3s var(--ease-out-expo)',
            cursor: 'pointer', fontSize: '12px'
        }}>
            <div style={{
                minWidth: '24px', height: '24px', borderRadius: '6px',
                background: index === 0 ? 'var(--primary)' : 'var(--bg-surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: index === 0 ? '#fff' : 'var(--text-tertiary)',
                fontWeight: 800, fontSize: '10px',
                boxShadow: index === 0 ? '0 0 12px var(--primary-glow)' : 'none'
            }}>
                {index + 1}
            </div>
            <span style={{ flex: 1, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{action}</span>
            <div style={{
                minWidth: '36px', textAlign: 'right', fontSize: '10px',
                fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: progress > 60 ? 'var(--success)' : 'var(--text-tertiary)'
            }}>
                {progress}%
            </div>
        </div>
    );
};

/* ─── Enhanced Project Card ─── */
const ProjectCard = ({ project, onComplete, onArchive, index }: {
    project: Project; onComplete: () => void; onArchive: () => void; index: number;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const actionsCompleted = Math.floor(project.actions.length * (0.3 + Math.random() * 0.5));
    const progress = Math.round((actionsCompleted / Math.max(1, project.actions.length)) * 100);

    const daysSinceCreation = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div
            className="sb-project-card group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative', borderRadius: '20px', overflow: 'hidden',
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered
                    ? '0 20px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px var(--border-glow), 0 0 40px -10px var(--primary-glow)'
                    : '0 4px 20px -5px rgba(0,0,0,0.2)',
                animationDelay: `${index * 100}ms`
            }}
        >
            {/* Top Gradient Accent */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--secondary-accent))',
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.3s ease'
            }} />

            {/* Background Glow */}
            <div style={{
                position: 'absolute', top: '-60px', right: '-60px',
                width: '200px', height: '200px',
                background: `radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)`,
                opacity: isHovered ? 0.3 : 0.1,
                transition: 'opacity 0.5s ease',
                pointerEvents: 'none'
            }} />

            <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <ObjectiveBadge objective={project.objective} />
                        <h4 style={{
                            fontFamily: 'var(--font-heading)', fontWeight: 800,
                            fontSize: '18px', lineHeight: 1.3, letterSpacing: '-0.02em',
                            color: 'var(--text-primary)',
                            transition: 'color 0.3s ease'
                        }}>
                            {project.title}
                        </h4>
                    </div>

                    {/* Progress Ring */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ProgressRing progress={progress} />
                        <span style={{
                            position: 'absolute', fontSize: '10px', fontWeight: 800,
                            fontFamily: 'var(--font-mono)', color: 'var(--text-primary)'
                        }}>
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p style={{
                    fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                    {project.description}
                </p>

                {/* Stats Row */}
                <div style={{
                    display: 'flex', gap: '16px', marginBottom: '16px',
                    paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)'
                }}>
                    {project.impact && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <TrendingUp size={13} style={{ color: 'var(--success)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Impact</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{project.impact}</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Layers size={13} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Actions</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{actionsCompleted}/{project.actions.length}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Clock size={13} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Age</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{daysSinceCreation}d</div>
                        </div>
                    </div>
                </div>

                {/* Expandable Actions */}
                <div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px 0', fontSize: '11px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            color: 'var(--text-tertiary)', transition: 'color 0.2s ease'
                        }}
                    >
                        <ChevronDown size={14} style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s var(--ease-out-expo)'
                        }} />
                        Key Actions ({project.actions.length})
                    </button>

                    <div style={{
                        maxHeight: isExpanded ? '400px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                        <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {project.actions.map((a, i) => (
                                <ActionItem key={i} action={a} index={i} total={project.actions.length} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '16px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="sb-action-btn sb-action-btn-success" onClick={onComplete} title="Mark Complete">
                            <CheckCircle2 size={14} />
                            <span>Complete</span>
                        </button>
                        <button className="sb-action-btn" onClick={onArchive} title="Archive">
                            <Archive size={14} />
                        </button>
                    </div>
                    <div style={{
                        fontSize: '10px', color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)', display: 'flex',
                        alignItems: 'center', gap: '4px'
                    }}>
                        <Calendar size={10} />
                        {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Completed Project Card ─── */
const CompletedCard = ({ project, index }: { project: Project; index: number }) => (
    <div
        className="sb-completed-card"
        style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '16px 20px', borderRadius: '14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            transition: 'all 0.3s var(--ease-out-expo)',
            animationDelay: `${index * 60}ms`
        }}
    >
        <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Trophy size={16} style={{ color: 'var(--success)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <h5 style={{
                fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
                {project.title}
            </h5>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Realized {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
        </div>
        {project.impact && (
            <div style={{
                padding: '4px 10px', borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                fontSize: '13px', fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--success)', whiteSpace: 'nowrap'
            }}>
                {project.impact}
            </div>
        )}
    </div>
);

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, color, glow }: {
    icon: any; label: string; value: string | number; color: string; glow: string;
}) => (
    <div className="sb-stat-card" style={{
        padding: '20px', borderRadius: '16px',
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.4s var(--ease-out-expo)'
    }}>
        <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px',
            background: `radial-gradient(circle, ${glow}, transparent)`,
            opacity: 0.2, pointerEvents: 'none'
        }} />
        <div style={{
            width: '38px', height: '38px', borderRadius: '11px',
            background: `${color}12`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px'
        }}>
            <Icon size={18} style={{ color }} />
        </div>
        <div style={{
            fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '4px'
        }}>
            {label}
        </div>
        <div style={{
            fontSize: '26px', fontWeight: 900, fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em', color: 'var(--text-primary)'
        }}>
            {value}
        </div>
    </div>
);

/* ═══════════════════════════════════
   MAIN: Strategic Board View
   ═══════════════════════════════════ */

export const ProjectsView = ({ token }: { token: string }) => {
    const { addToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board');
    const [filterObjective, setFilterObjective] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'impact'>('newest');

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
                addToast('Strategy status updated', 'success');
            }
        } catch (error) {
            addToast('Update failed', 'error');
        }
    };

    const deleteProject = async (id: string) => {
        if (!confirm('Archive this strategic initiative?')) return;
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setProjects(projects.filter(p => p.id !== id));
                addToast('Initiative archived', 'success');
            }
        } catch (error) {
            addToast('Archive failed', 'error');
        }
    };

    const activeProjects = useMemo(() => {
        let filtered = projects.filter(p => p.status === 'active');
        if (filterObjective !== 'all') {
            filtered = filtered.filter(p => p.objective === filterObjective);
        }
        if (sortBy === 'impact') {
            filtered.sort((a, b) => (b.impact || '').localeCompare(a.impact || ''));
        } else {
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return filtered;
    }, [projects, filterObjective, sortBy]);

    const completedProjects = projects.filter(p => p.status === 'completed');
    const objectives = [...new Set(projects.map(p => p.objective))];

    // Calculate total impact
    const totalImpactDisplay = useMemo(() => {
        const impacts = projects.filter(p => p.impact).map(p => p.impact!);
        return impacts.length > 0 ? impacts[0] : '—';
    }, [projects]);

    /* ─── Loading State ─── */
    if (loading) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: '20px'
            }}>
                <div className="sb-loading-ring" />
                <div style={{
                    fontSize: '14px', fontWeight: 600,
                    color: 'var(--text-secondary)', letterSpacing: '-0.01em'
                }}>
                    Synthesizing Strategic Intelligence...
                </div>
            </div>
        );
    }

    return (
        <div className="sb-root fade-in" style={{
            padding: '32px', maxWidth: '1500px', margin: '0 auto',
            fontFamily: 'var(--font-main)', position: 'relative',
            minHeight: '100%'
        }}>
            <StrategicParticles />

            {/* ─── Hero Header ─── */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div className="sb-hero-icon">
                                <Target size={22} />
                            </div>
                            <div>
                                <h1 style={{
                                    fontFamily: 'var(--font-heading)', fontSize: '28px',
                                    fontWeight: 900, letterSpacing: '-0.03em',
                                    lineHeight: 1.1, margin: 0
                                }}>
                                    Strategic <span className="text-gradient">Command</span>
                                </h1>
                            </div>
                            <div className="sb-live-badge">
                                <div className="sb-live-dot" />
                                <span>LIVE</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '52px', marginTop: '-2px' }}>
                            AI-orchestrated strategic initiatives — track, execute, and realize value.
                        </p>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="sb-control-group">
                            <button className={`sb-control-btn ${viewMode === 'board' ? 'active' : ''}`}
                                onClick={() => setViewMode('board')} title="Board View">
                                <LayoutGrid size={14} />
                            </button>
                            <button className={`sb-control-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                                onClick={() => setViewMode('timeline')} title="Timeline View">
                                <List size={14} />
                            </button>
                        </div>

                        <select
                            className="sb-select"
                            value={filterObjective}
                            onChange={e => setFilterObjective(e.target.value)}
                        >
                            <option value="all">All Objectives</option>
                            {objectives.map(o => (
                                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                            ))}
                        </select>

                        <select
                            className="sb-select"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="impact">By Impact</option>
                        </select>

                        <button className="sb-refresh-btn" onClick={fetchProjects} title="Refresh">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Stats Overview ─── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 1
            }}>
                <StatCard
                    icon={Rocket}
                    label="In Execution"
                    value={activeProjects.length}
                    color="#3b82f6"
                    glow="rgba(59, 130, 246, 0.3)"
                />
                <StatCard
                    icon={Trophy}
                    label="Value Realized"
                    value={completedProjects.length}
                    color="#10b981"
                    glow="rgba(16, 185, 129, 0.3)"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Top Impact"
                    value={totalImpactDisplay}
                    color="#8b5cf6"
                    glow="rgba(139, 92, 246, 0.3)"
                />
                <StatCard
                    icon={Zap}
                    label="Total Initiatives"
                    value={projects.length}
                    color="#f59e0b"
                    glow="rgba(245, 158, 11, 0.3)"
                />
            </div>

            {/* ─── Main Content ─── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: completedProjects.length > 0 ? '1fr 380px' : '1fr',
                gap: '28px', position: 'relative', zIndex: 1
            }}>
                {/* Active Projects Column */}
                <div>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="sb-section-dot" style={{ background: 'var(--primary)' }} />
                            <h2 style={{
                                fontFamily: 'var(--font-heading)', fontSize: '18px',
                                fontWeight: 800, letterSpacing: '-0.02em', margin: 0
                            }}>
                                In Execution
                            </h2>
                            <span className="sb-count-badge">{activeProjects.length}</span>
                        </div>
                    </div>

                    {activeProjects.length > 0 ? (
                        <div style={{
                            display: viewMode === 'board'
                                ? 'grid' : 'flex',
                            gridTemplateColumns: viewMode === 'board' ? 'repeat(auto-fill, minmax(380px, 1fr))' : undefined,
                            flexDirection: viewMode === 'timeline' ? 'column' : undefined,
                            gap: '20px'
                        }}>
                            {activeProjects.map((project, i) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={i}
                                    onComplete={() => updateStatus(project.id, 'completed')}
                                    onArchive={() => deleteProject(project.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="sb-empty-state">
                            <div className="sb-empty-icon">
                                <Sparkles size={32} />
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-heading)', fontSize: '18px',
                                fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em'
                            }}>
                                No Active Initiatives
                            </h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '360px' }}>
                                Use <strong style={{ color: 'var(--primary)' }}>Nexus AI</strong> to generate
                                data-driven strategic recommendations tailored to your business.
                            </p>
                            <div className="sb-empty-pulse" />
                        </div>
                    )}
                </div>

                {/* Completed Projects Column */}
                {completedProjects.length > 0 && (
                    <div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            marginBottom: '20px'
                        }}>
                            <div className="sb-section-dot" style={{ background: 'var(--success)' }} />
                            <h2 style={{
                                fontFamily: 'var(--font-heading)', fontSize: '18px',
                                fontWeight: 800, letterSpacing: '-0.02em', margin: 0,
                                opacity: 0.8
                            }}>
                                Value Realized
                            </h2>
                            <span className="sb-count-badge sb-count-badge-success">{completedProjects.length}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {completedProjects.map((project, i) => (
                                <CompletedCard key={project.id} project={project} index={i} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Inline Styles ─── */}
            <style>{`
                /* ─── Loading Ring ─── */
                .sb-loading-ring {
                    width: 48px; height: 48px;
                    border: 3px solid var(--border-subtle);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: sb-spin 1s linear infinite;
                }
                @keyframes sb-spin { to { transform: rotate(360deg); } }

                /* ─── Hero Icon ─── */
                .sb-hero-icon {
                    width: 40px; height: 40px; border-radius: 12px;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; box-shadow: 0 4px 20px -4px var(--primary-glow);
                    animation: sb-hero-pulse 3s ease-in-out infinite;
                }
                @keyframes sb-hero-pulse {
                    0%, 100% { box-shadow: 0 4px 20px -4px var(--primary-glow); }
                    50% { box-shadow: 0 4px 30px -2px var(--primary-glow), 0 0 50px -10px var(--accent-glow); }
                }

                /* ─── Live Badge ─── */
                .sb-live-badge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 3px 10px; border-radius: 20px;
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .sb-live-badge span {
                    font-size: 9px; font-weight: 900; letter-spacing: 0.1em;
                    color: var(--success); font-family: var(--font-mono);
                }
                .sb-live-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: var(--success);
                    animation: sb-breathe 2s ease-in-out infinite;
                }
                @keyframes sb-breathe {
                    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    50% { opacity: 0.6; transform: scale(0.9); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
                }

                /* ─── Control Group ─── */
                .sb-control-group {
                    display: flex; border-radius: 10px; overflow: hidden;
                    border: 1px solid var(--border-default);
                    background: var(--bg-surface);
                }
                .sb-control-btn {
                    background: none; border: none; cursor: pointer;
                    padding: 8px 12px; color: var(--text-tertiary);
                    transition: all 0.2s ease; display: flex;
                    align-items: center; justify-content: center;
                }
                .sb-control-btn:hover { color: var(--text-primary); background: var(--bg-surface-hover); }
                .sb-control-btn.active {
                    color: var(--primary); background: var(--primary-subtle);
                }

                /* ─── Select ─── */
                .sb-select {
                    padding: 8px 12px; border-radius: 10px; font-size: 12px;
                    background: var(--bg-surface); border: 1px solid var(--border-default);
                    color: var(--text-secondary); cursor: pointer;
                    font-family: var(--font-main); font-weight: 600;
                    transition: all 0.2s ease; appearance: none;
                    padding-right: 28px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                }
                .sb-select:hover { border-color: var(--border-glow); }
                .sb-select:focus {
                    outline: none; border-color: var(--primary);
                    box-shadow: 0 0 0 3px var(--primary-subtle);
                }

                /* ─── Refresh Button ─── */
                .sb-refresh-btn {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: var(--bg-surface); border: 1px solid var(--border-default);
                    color: var(--text-tertiary); cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s ease;
                }
                .sb-refresh-btn:hover {
                    color: var(--primary); border-color: var(--border-glow);
                    background: var(--primary-subtle);
                    transform: rotate(180deg);
                }

                /* ─── Section Dot ─── */
                .sb-section-dot {
                    width: 10px; height: 10px; border-radius: 50%;
                    box-shadow: 0 0 12px currentColor;
                }

                /* ─── Count Badge ─── */
                .sb-count-badge {
                    min-width: 24px; height: 22px; border-radius: 20px;
                    background: var(--primary-subtle); color: var(--primary);
                    font-size: 11px; font-weight: 800; font-family: var(--font-mono);
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 8px;
                }
                .sb-count-badge-success {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--success);
                }

                /* ─── Stat Cards ─── */
                .sb-stat-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--border-glow);
                    box-shadow: 0 8px 30px -8px rgba(0,0,0,0.3);
                }

                /* ─── Action Buttons ─── */
                .sb-action-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 6px 12px; border-radius: 8px; font-size: 11px;
                    font-weight: 700; cursor: pointer; border: 1px solid var(--border-default);
                    background: var(--bg-surface); color: var(--text-secondary);
                    transition: all 0.2s var(--ease-out-expo);
                    font-family: var(--font-main);
                }
                .sb-action-btn:hover {
                    background: var(--bg-surface-hover);
                    border-color: var(--border-glow);
                    color: var(--text-primary);
                    transform: translateY(-1px);
                }
                .sb-action-btn-success:hover {
                    background: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: var(--success);
                }

                /* ─── Action Items ─── */
                .sb-action-item:hover {
                    background: var(--bg-surface-hover) !important;
                    border-color: var(--border-glow) !important;
                    transform: translateX(4px);
                }

                /* ─── Project Cards ─── */
                .sb-project-card {
                    animation: sb-card-enter 0.6s var(--ease-out-expo) backwards;
                }
                @keyframes sb-card-enter {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ─── Completed Cards ─── */
                .sb-completed-card {
                    animation: sb-slide-in 0.4s var(--ease-out-expo) backwards;
                }
                .sb-completed-card:hover {
                    background: var(--bg-surface) !important;
                    border-color: var(--border-glow) !important;
                    transform: translateX(4px);
                    box-shadow: 0 4px 16px -4px rgba(0,0,0,0.2);
                }
                @keyframes sb-slide-in {
                    from { opacity: 0; transform: translateX(-12px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* ─── Empty State ─── */
                .sb-empty-state {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; padding: 80px 32px;
                    border-radius: 20px; border: 2px dashed var(--border-default);
                    background: linear-gradient(180deg, var(--bg-surface) 0%, transparent 100%);
                    position: relative; overflow: hidden;
                    text-align: center;
                }
                .sb-empty-icon {
                    width: 64px; height: 64px; border-radius: 18px;
                    background: linear-gradient(135deg, var(--primary-subtle), rgba(139, 92, 246, 0.08));
                    display: flex; align-items: center; justify-content: center;
                    color: var(--primary); margin-bottom: 20px;
                    animation: sb-float 4s ease-in-out infinite;
                }
                @keyframes sb-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .sb-empty-pulse {
                    position: absolute; top: 50%; left: 50%;
                    width: 200px; height: 200px; border-radius: 50%;
                    background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
                    transform: translate(-50%, -50%);
                    animation: sb-pulse-expand 4s ease-in-out infinite;
                    pointer-events: none; opacity: 0.2;
                }
                @keyframes sb-pulse-expand {
                    0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.2; }
                    50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.08; }
                }

                /* ─── Responsive ─── */
                @media (max-width: 1024px) {
                    .sb-root > div:last-of-type {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 768px) {
                    .sb-root { padding: 20px !important; }
                }
            `}</style>
        </div>
    );
};
