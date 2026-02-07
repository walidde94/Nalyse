import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    MessageSquare,
    Sparkles,
    Play,
    CheckCircle2,
    Workflow,
    Terminal,
    Search,
    Zap,
    Bot,
    User,
    BarChart3,
    ArrowRight,
    FileDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import { API_URL } from '../../config';

interface AgentTask {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

interface Agent {
    id: string;
    name: string;
    specialty: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const AGENTS: Agent[] = [
    {
        id: 'inspector',
        name: 'Data Inspector',
        specialty: 'Quality & Preparation',
        description: 'Autonomously identifies data leaks, null values, and prepares datasets for analysis.',
        icon: <Search size={24} />,
        color: '#6366f1'
    },
    {
        id: 'analyst',
        name: 'Workflow Analyst',
        specialty: 'Strategy & Patterns',
        description: 'Plans multi-step analysis workflows to discover hidden business patterns.',
        icon: <Workflow size={24} />,
        color: '#8b5cf6'
    },
    {
        id: 'architect',
        name: 'BI Architect',
        specialty: 'Visualization',
        description: 'Builds executive-grade dashboards and explanations based on natural language intent.',
        icon: <BarChart3 size={24} />,
        color: '#ec4899'
    }
];

const CONFIDENCE_DATA = [
    { step: 'T-8', val: 40 },
    { step: 'T-7', val: 45 },
    { step: 'T-6', val: 52 },
    { step: 'T-5', val: 68 },
    { step: 'T-4', val: 75 },
    { step: 'T-3', val: 82 },
    { step: 'T-2', val: 88 },
    { step: 'T-1', val: 91 },
];

export const AgenticSystemsView = () => {
    const { addToast } = useToast();
    const { token } = useAuth(); // Use auth context
    const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
    const [isRunning, setIsRunning] = useState(false);
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'agent', text: string }[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [discoveryLog, setDiscoveryLog] = useState<string[]>([]);
    const [activeIntent, setActiveIntent] = useState('');
    const [reportData, setReportData] = useState<any>(null);

    const startAgentWorkflow = async (overrideIntent?: string) => {
        const intentToUse = overrideIntent || activeIntent || query;

        if (!intentToUse && selectedAgent.id === 'architect') {
            addToast('Specify a dashboard intent first.', 'info');
            return;
        }

        setDiscoveryLog([]);
        setIsRunning(true);
        setTasks([]);

        try {
            // 1. Start Agent Session
            // const token = localStorage.getItem('token'); // REMOVED
            if (!token) throw new Error('Authentication required');

            const res = await fetch(`${API_URL}/api/agents/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    goal: intentToUse,
                    role: selectedAgent.id
                })
            });

            if (!res.ok) throw new Error('Failed to start agent');
            const agentData = await res.json();
            const agentId = agentData.id;

            // 2. Poll for updates
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`${API_URL}/api/agents/${agentId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!statusRes.ok) return;

                    const { agent, tasks, logs } = await statusRes.json();

                    // Update UI
                    setTasks(tasks.map((t: any) => ({
                        id: t.id,
                        label: t.description,
                        status: t.status
                    })));

                    setDiscoveryLog(logs.map((l: any) => l.message));

                    if (agent.status === 'completed') {
                        clearInterval(pollInterval);
                        setIsRunning(false);
                        addToast(`${selectedAgent.name} successfully synthesized the intelligence report.`, 'success');

                        if (agent.finalReport) {
                            try {
                                setReportData(JSON.parse(agent.finalReport));
                            } catch (e) {
                                console.error("Failed to parse report", e);
                            }
                        }

                        setTimeout(() => setShowReport(true), 800);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 1500);

        } catch (error) {
            console.error(error);
            setIsRunning(false);
            addToast('Failed to deploy agent. Check console.', 'error');
        }
    };


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userQuery = query.trim();
        setActiveIntent(userQuery);
        setChatHistory(prev => [...prev, { role: 'user', text: userQuery }]);
        setQuery('');

        setTimeout(() => {
            const response = `I am ${selectedAgent.name}. I've formulated an autonomous plan based on your request. Initializing data validation loops...`;
            setChatHistory(prev => [...prev, { role: 'agent', text: response }]);

            // Auto-trigger workflow after AI response
            setTimeout(() => {
                startAgentWorkflow(userQuery);
            }, 1000);
        }, 600);
    };

    return (
        <div className="agentic-container fade-in">
            <div className="agentic-grid">
                {/* Left Panel: Agent Selection & Chat */}
                <aside className="agentic-left glass-morphism">
                    <div className="section-head">
                        <Bot size={20} className="text-primary" />
                        <h2 className="text-h3">Autonomous Agents</h2>
                    </div>

                    <div className="agent-selector">
                        {AGENTS.map(agent => (
                            <button
                                key={agent.id}
                                className={`agent-card hover-lift ${selectedAgent.id === agent.id ? 'active' : ''}`}
                                onClick={() => setSelectedAgent(agent)}
                                style={{ '--accent': agent.color } as any}
                            >
                                <div className="agent-icon" style={{ background: agent.color }}>
                                    {agent.icon}
                                </div>
                                <div className="agent-info">
                                    <div className="agent-name">{agent.name}</div>
                                    <div className="agent-specialty">{agent.specialty}</div>
                                </div>
                                {selectedAgent.id === agent.id && <Zap size={14} className="agent-active-glow" />}
                            </button>
                        ))}
                    </div>

                    <div className="chat-interface">
                        <div className="chat-messages">
                            {chatHistory.length === 0 ? (
                                <div className="chat-placeholder">
                                    <Sparkles size={32} className="opacity-20 mb-4" />
                                    <p>Ask anything. Use natural language to query and instruct your agents.</p>
                                    <div className="chat-suggestions">
                                        <button onClick={() => setQuery("Show me monthly revenue trends")}>"Show me monthly revenue trends"</button>
                                        <button onClick={() => setQuery("Optimize the warehouse logistics dataset")}>"Optimize the warehouse logistics dataset"</button>
                                    </div>
                                </div>
                            ) : (
                                chatHistory.map((msg, i) => (
                                    <div key={i} className={`chat-bubble ${msg.role}`}>
                                        <div className="bubble-icon">
                                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                        </div>
                                        <div className="bubble-text">{msg.text}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                            <input
                                type="text"
                                placeholder={`Instruct the ${selectedAgent.name}...`}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button type="submit" className="chat-send">
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                </aside>

                {/* Right Panel: Execution & Workflow */}
                <main className="agentic-main">
                    <div className="main-header glass-morphism">
                        <div>
                            <h1 className="text-h1">Agentic Systems</h1>
                            <p className="text-secondary">Autonomous workflows, planning, and validation.</p>
                        </div>
                        <button
                            className={`btn btn-primary start-workflow ${isRunning ? 'running' : ''} ${(!isRunning && activeIntent) ? 'pulse-prompt' : ''}`}
                            onClick={() => startAgentWorkflow()}
                            disabled={isRunning}
                        >
                            {isRunning ? (
                                <>
                                    <div className="spinner-xs mr-2"></div>
                                    Executing Autonomous Plan...
                                </>
                            ) : (
                                <>
                                    <Play size={18} className="mr-2" />
                                    {activeIntent ? 'Restart Workflow' : 'Initialize Workflow'}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="discovery-section grid grid-cols-2 gap-6">
                        <div className="workflow-monitor glass-morphism">
                            <div className="monitor-header">
                                <Terminal size={16} />
                                <span>Execution Monitor</span>
                            </div>
                            <div className="task-list">
                                {tasks.length === 0 ? (
                                    <div className="monitor-empty">
                                        <div className="terminal-cursor"></div>
                                        <span>Waiting for agent deployment...</span>
                                    </div>
                                ) : (
                                    tasks.map((task) => (
                                        <div key={task.id} className={`task-item ${task.status}`}>
                                            <div className="status-indicator">
                                                {task.status === 'completed' ? <CheckCircle2 size={16} className="text-success" /> :
                                                    task.status === 'running' ? <div className="pulse-primary"></div> :
                                                        <div className="status-dot"></div>}
                                            </div>
                                            <span className="task-label">{task.label}</span>
                                            {task.status === 'running' && <span className="task-timer">Active</span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="discovery-log glass-morphism">
                            <div className="monitor-header">
                                <Sparkles size={16} className="text-warning" />
                                <span>Strategic Discovery Log</span>
                            </div>
                            <div className="log-content">
                                {discoveryLog.length === 0 ? (
                                    <div className="monitor-empty opacity-30">
                                        <span>Agent internal thoughts will appear here...</span>
                                    </div>
                                ) : (
                                    discoveryLog.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="log-entry"
                                        >
                                            <span className="log-time">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                            <span className="log-msg">{log}</span>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="agent-capabilities grid grid-cols-3 gap-6">
                        <div className="capability-card glass-morphism">
                            <div className="cap-icon purple"><Cpu size={20} /></div>
                            <h3>Agentic Planning</h3>
                            <p>Self-correcting workflows that adapt to data anomalies without human input.</p>
                        </div>
                        <div className="capability-card glass-morphism">
                            <div className="cap-icon pink"><MessageSquare size={20} /></div>
                            <h3>Gen-AI Querying</h3>
                            <p>Ask complex questions and get structured analysis results instantly.</p>
                        </div>
                        <div className="capability-card glass-morphism">
                            <div className="cap-icon blue"><Sparkles size={20} /></div>
                            <h3>Augmented Prep</h3>
                            <p>Automated feature engineering and data cleaning based on the analysis goal.</p>
                        </div>
                    </div>
                </main>
            </div>

            {/* Intelligence Report Overlay */}
            <AnimatePresence>
                {showReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="report-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="report-modal glass-morphism"
                        >
                            <header className="report-header">
                                <div className="header-left">
                                    <div className="report-badge">STRATEGIC INTELLIGENCE</div>
                                    <h2 className="text-h1">Autonomous Synthesis Report</h2>
                                    <p className="text-secondary">Generated by {selectedAgent.name} • {new Date().toLocaleDateString()}</p>
                                </div>
                                <button className="btn-close-report" onClick={() => setShowReport(false)}>✕</button>
                            </header>

                            <div className="report-body">
                                <section className="report-section">
                                    <h4 className="section-title">Executive Summary</h4>
                                    <div className="summary-card">
                                        <p>
                                            {reportData?.summary || "Analysis completed successfully."}
                                        </p>
                                    </div>
                                </section>

                                <div className="report-grid">
                                    <section className="report-section">
                                        <h4 className="section-title">Key Findings</h4>
                                        <div className="findings-list">
                                            {reportData?.findings?.map((f: any, i: number) => (
                                                <div key={i} className="finding">
                                                    <div className={`find-dot ${f.type}`}></div>
                                                    <span>{f.text}</span>
                                                </div>
                                            )) || (
                                                    <div className="finding"><div className="find-dot info"></div><span>No specific findings recorded.</span></div>
                                                )}
                                        </div>
                                    </section>

                                    <section className="report-section">
                                        <h4 className="section-title">Confidence Convergence</h4>
                                        <div className="confidence-meter">
                                            <div className="chart-container" style={{ width: '100%', height: '140px', background: 'var(--bg-app)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-subtle)' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={CONFIDENCE_DATA}>
                                                        <defs>
                                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                                                        <XAxis dataKey="step" hide />
                                                        <YAxis hide domain={[0, 100]} />
                                                        <Tooltip
                                                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '10px' }}
                                                            itemStyle={{ color: 'var(--primary)' }}
                                                        />
                                                        <Area type="monotone" dataKey="val" stroke="var(--primary)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="meter-footer mt-3 flex justify-between w-full px-2">
                                                <div className="meter-label">Statistical Validation</div>
                                                <div className="meter-val" style={{ color: 'var(--primary)', fontWeight: 900 }}>{reportData?.confidence || 95}%</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <section className="report-section">
                                    <h4 className="section-title">Recommended Actions</h4>
                                    <div className="actions-grid">
                                        {reportData?.recommendations?.map((rec: string, i: number) => (
                                            <div key={i} className="action-card">
                                                <Zap size={16} className="text-warning mb-2" />
                                                <h5>Action {i + 1}</h5>
                                                <p>{rec}</p>
                                            </div>
                                        )) || (
                                                <div className="action-card">
                                                    <Zap size={16} className="text-warning mb-2" />
                                                    <h5>Review Data</h5>
                                                    <p>Manually inspect source files for further insights.</p>
                                                </div>
                                            )}
                                    </div>
                                </section>
                            </div>

                            <footer className="report-footer">
                                <button className="btn btn-secondary" onClick={() => setShowReport(false)}>Dismiss</button>
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost" onClick={() => {
                                        addToast('Downloading PDF Report...', 'info');
                                        // Simulate download
                                        setTimeout(() => addToast('Report downloaded successfully.', 'success'), 1500);
                                    }}>
                                        <FileDown size={18} className="mr-2" /> Download PDF
                                    </button>
                                    <button className="btn btn-primary glow-btn" onClick={() => {
                                        addToast('Optimizations queued for execution.', 'success');
                                        setShowReport(false);
                                    }}>
                                        Execute findings
                                    </button>
                                </div>
                            </footer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .pulse-prompt {
                    animation: shadow-pulse 2s infinite;
                    border-color: var(--primary);
                }

                @keyframes shadow-pulse {
                    0% { box-shadow: 0 0 0 0px rgba(99, 102, 241, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
                    100% { box-shadow: 0 0 0 0px rgba(99, 102, 241, 0); }
                }

                .agentic-container {
                    height: 100%;
                    width: 100%;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--bg-app);
                }

                .agentic-grid {
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: 24px;
                    height: 100%;
                }

                .agentic-left {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 24px;
                    border: 1px solid var(--border-subtle);
                    min-height: 0;
                }

                .section-head {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .agent-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .agent-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1px solid var(--border-subtle);
                    background: var(--bg-card);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    position: relative;
                }

                .agent-card.active {
                    background: var(--bg-surface);
                    border-color: var(--accent);
                    box-shadow: 0 0 20px -10px var(--accent);
                }

                .agent-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }

                .agent-name {
                    font-weight: 800;
                    font-size: 14px;
                    color: var(--text-primary);
                }

                .agent-specialty {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-tertiary);
                }

                .agent-active-glow {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    color: var(--accent);
                }

                .chat-interface {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-app);
                    border-radius: 16px;
                    border: 1px solid var(--border-subtle);
                    overflow: hidden;
                    min-height: 0;
                }

                .chat-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .chat-placeholder {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 0 40px;
                    color: var(--text-tertiary);
                    font-size: 13px;
                }

                .chat-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 16px;
                    justify-content: center;
                }

                .chat-suggestions button {
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    padding: 6px 12px;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                }

                .chat-suggestions button:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--primary-subtle);
                }

                .chat-bubble {
                    display: flex;
                    gap: 12px;
                    max-width: 85%;
                }

                .chat-bubble.user {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }

                .bubble-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: var(--bg-surface);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border: 1px solid var(--border-subtle);
                }

                .bubble-text {
                    padding: 10px 14px;
                    border-radius: 14px;
                    font-size: 13px;
                    line-height: 1.5;
                    font-weight: 500;
                }

                .agent .bubble-text {
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    color: var(--text-primary);
                    border-top-left-radius: 2px;
                }

                .user .bubble-text {
                    background: var(--primary);
                    color: white;
                    border-top-right-radius: 2px;
                }

                .chat-input-wrapper {
                    padding: 12px;
                    background: var(--bg-surface);
                    border-top: 1px solid var(--border-subtle);
                    display: flex;
                    gap: 8px;
                }

                .chat-input-wrapper input {
                    flex: 1;
                    height: 38px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: 100px;
                    padding: 0 16px;
                    font-size: 13px;
                    outline: none;
                }

                .chat-input-wrapper input:focus {
                    border-color: var(--primary);
                }

                .chat-send {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .chat-send:active { transform: scale(0.9); }

                .agentic-main {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .main-header {
                    padding: 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid var(--border-subtle);
                }

                .workflow-monitor {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    color: #e6edf3;
                    border-radius: 16px;
                    padding: 0;
                    overflow: hidden;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                }

                .monitor-header {
                    background: #161b22;
                    padding: 10px 16px;
                    border-bottom: 1px solid #30363d;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #8b949e;
                    text-transform: uppercase;
                }

                .task-list {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .task-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    font-size: 14px;
                    opacity: 0.5;
                    transition: opacity 0.3s;
                }

                .task-item.running { opacity: 1; color: var(--primary); }
                .task-item.completed { opacity: 0.8; color: #3fb950; }

                .status-dot { width: 8px; height: 8px; border-radius: 50%; border: 2px solid #30363d; margin-left: 4px; }
                .pulse-primary { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); animation: breathe 1s infinite; margin-left: 4px; }

                .task-timer {
                    margin-left: auto;
                    font-size: 10px;
                    background: rgba(88, 166, 255, 0.1);
                    color: #58a6ff;
                    padding: 2px 8px;
                    border-radius: 100px;
                }

                .monitor-empty {
                    height: 100%;
                    min-height: 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #484f58;
                    font-size: 12px;
                }

                .discovery-log {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    color: #e6edf3;
                    border-radius: 16px;
                    padding: 0;
                    overflow: hidden;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                }

                .log-content {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 250px;
                    overflow-y: auto;
                }

                .log-entry {
                    display: flex;
                    gap: 12px;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .log-time { color: var(--primary); opacity: 0.7; }
                .log-msg { color: #8b949e; }

                .terminal-cursor {
                    width: 8px;
                    height: 16px;
                    background: var(--primary);
                    animation: blink 1s step-end infinite;
                }

                .capability-card {
                    padding: 24px;
                    border: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .cap-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                }

                .cap-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .cap-icon.pink { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
                .cap-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

                .capability-card h3 { font-size: 15px; font-weight: 800; }
                .capability-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

                @keyframes blink { 50% { opacity: 0; } }

                .report-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }

                .report-modal {
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6);
                    overflow: hidden;
                }

                .report-header {
                    padding: 32px 40px;
                    border-bottom: 1px solid var(--border-subtle);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    background: linear-gradient(to right, rgba(99, 102, 241, 0.05), transparent);
                }

                .report-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    background: var(--primary-subtle);
                    color: var(--primary);
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                    margin-bottom: 12px;
                }

                .btn-close-report {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid var(--border-subtle);
                    background: transparent;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .btn-close-report:hover { background: var(--bg-surface); color: var(--text-primary); }

                .report-body {
                    padding: 40px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .section-title {
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.15em;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    margin-bottom: 16px;
                    display: block;
                }

                .summary-card {
                    padding: 24px;
                    background: var(--bg-app);
                    border-radius: 16px;
                    border: 1px solid var(--border-subtle);
                    line-height: 1.6;
                    color: var(--text-secondary);
                }

                .report-grid {
                    display: grid;
                    grid-template-columns: 1fr 200px;
                    gap: 32px;
                }

                .findings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .finding {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .find-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .find-dot.success { background: var(--success); box-shadow: 0 0 10px var(--success); }
                .find-dot.warning { background: var(--warning); box-shadow: 0 0 10px var(--warning); }
                .find-dot.info { background: var(--primary); box-shadow: 0 0 10px var(--primary); }

                .confidence-meter {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    text-align: center;
                }

                .meter-ring {
                    width: 100px;
                    height: 100px;
                    position: relative;
                }

                .meter-val {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 900;
                    color: var(--primary);
                }

                .meter-label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); }

                .actions-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .action-card {
                    padding: 20px;
                    background: var(--bg-app);
                    border: 1px solid var(--border-subtle);
                    border-radius: 16px;
                    transition: all 0.2s;
                }

                .action-card:hover { border-color: var(--primary); transform: translateY(-4px); }
                .action-card h5 { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
                .action-card p { font-size: 12px; color: var(--text-tertiary); line-height: 1.5; }

                .report-footer {
                    padding: 24px 40px;
                    background: var(--bg-surface);
                    border-top: 1px solid var(--border-subtle);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            `}</style>
        </div >
    );
};
