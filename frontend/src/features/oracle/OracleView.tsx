import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';

type StrategicObjective = 'revenue_growth' | 'cost_optimization' | 'risk_mitigation' | 'operational_efficiency';

interface Insight {
    id: number;
    title: string;
    category: string;
    desc: string;
    impact: string;
    confidence: number;
    status: string;
    actions: string[];
}

interface NexusViewProps {
    files: any[];
    groups: any[];
    token: string;
    onProjectCreated?: () => void;
    runWithProgress?: (fn: () => Promise<void | { type: string; title: string; data: any }>) => Promise<void>;
}

import { API_URL } from '../../config';

export const NexusView = ({ files, groups, token, onProjectCreated, runWithProgress }: NexusViewProps) => {
    const { addToast } = useToast();
    const [phase, setPhase] = useState<'selection' | 'processing' | 'dashboard'>('selection');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [objective, setObjective] = useState<StrategicObjective>('revenue_growth');
    const [insights, setInsights] = useState<Insight[]>([]);
    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [isExecuting, setIsExecuting] = useState(false);

    const logs = [
        "Initializing Neural Knowledge Mesh...",
        "Scanning for Inter-Departmental Correlations...",
        "Evaluating Dataset Consistency & Integrity...",
        "Modeling Potential Strategic Scenarios...",
        "Validating Optimization Hypotheses...",
        "Assembling Executive Intelligence Draft..."
    ];

    useEffect(() => {
        if (phase === 'processing') {
            let i = 0;
            const interval = setInterval(() => {
                if (i < logs.length) {
                    setAnalysisProgress(((i + 1) / logs.length) * 100);
                    i++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        setPhase('dashboard');
                        generateInsights();
                    }, 400);
                }
            }, 800);
            return () => clearInterval(interval);
        }
    }, [phase]);

    const runAnalysis = () => {
        if (selectedFileIds.length < 1) {
            addToast('Select at least one knowledge source.', 'info');
            return;
        }

        const worker = async () => {
            setPhase('processing');
            // Mock intelligence synthesis duration
            await new Promise(r => setTimeout(r, 4500));
            return { type: 'projects', title: 'Strategic Board', data: {} };
        };

        if (runWithProgress) {
            runWithProgress(worker);
        } else {
            worker();
        }
    };

    const generateInsights = () => {
        const objectiveMap: Record<StrategicObjective, Insight[]> = {
            revenue_growth: [
                { id: 1, title: "Market Expansion Strategy", category: "Revenue", desc: "Cross-regional performance analysis suggests a conversion delta between DACH and other primary markets. Budget reallocation could optimize acquisition costs.", impact: "Increase ARR", confidence: 92, status: "High Priority", actions: ["Review regional acquisition costs", "Evaluate DACH market capacity", "Optimize ad spend distribution"] },
                { id: 2, title: "Churn Vector Analysis", category: "Retention", desc: "Temporal analysis indicates a correlation between support tickets and account stability. Proactive engagement thresholds identified.", impact: "Reduce Churn", confidence: 85, status: "Critical", actions: ["Enable automated health alerts", "Review support escalation logs"] }
            ],
            cost_optimization: [
                { id: 1, title: "Infrastructure Leakage", category: "OpEx", desc: "Instance utilization heatmaps show significant off-peak waste. Resource scheduling optimization recommended.", impact: "Reduce Monthly OpEx", confidence: 95, status: "Immediate", actions: ["Apply auto-scaling policies", "Audit idle cloud resources"] },
                { id: 2, title: "Operational Redundancy", category: "Efficiency", desc: "Dataset overlap detection found duplicated tracking for logistics units. Consolidation can reduce storage and management overhead.", impact: "Process Savings", confidence: 90, status: "Urgent", actions: ["Consolidate duplicate SKUs", "Review warehouse storage contracts"] }
            ],
            risk_mitigation: [
                { id: 1, title: "Supply Chain Exposure", category: "Risk", desc: "Concentration analysis identifies dependency on specific vendor clusters. Diversification recommended for business continuity.", impact: "Lower Exposure", confidence: 80, status: "Board Level", actions: ["Identify secondary vendors", "Stress test supply logistics"] },
                { id: 2, title: "Compliance Data Exposure", category: "Governance", desc: "Sensitive data patterns detected in legacy datasets. Security protocols should be updated to enforce masking.", impact: "Zero Risk Target", confidence: 98, status: "Blocked", actions: ["Audit API access logs", "Apply PII anonymization"] }
            ],
            operational_efficiency: [
                { id: 1, title: "Approval Bottleneck", category: "Process", desc: "Cycle time analysis shows delay in approval workflows compared to benchmarks. Automation can accelerate deal velocity.", impact: "Gain Velocity", confidence: 88, status: "Operational", actions: ["Implement digital workflow tools", "Review template hierarchies"] },
                { id: 2, title: "Skill Mismatch Gap", category: "Talent", desc: "Resource allocation data shows high expert involvement in elementary tasks. Workflow redistribution could unlock significant productive hours.", impact: "Reclaim Hours", confidence: 82, status: "Optimized", actions: ["Update escalation protocols", "Review team task assignments"] }
            ]
        };
        const results = objectiveMap[objective];
        setInsights(results);
        setSelectedInsight(results[0]);
    };

    const handleExecute = async () => {
        if (!selectedInsight || !token) return;

        setIsExecuting(true);
        try {
            const res = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: selectedInsight.title,
                    description: selectedInsight.desc,
                    objective: objective,
                    actions: selectedInsight.actions,
                    impact: selectedInsight.impact,
                    status: 'active'
                })
            });

            if (res.ok) {
                addToast('Strategic Project Created Successfully', 'success');
                if (onProjectCreated) onProjectCreated();
            } else {
                throw new Error('Failed to create project');
            }
        } catch (error) {
            addToast('Failed to create project', 'error');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="nexus-frame fade-in">
            <div className="nexus-canvas"></div>

            <header className="nexus-top">
                <h1 className="nexus-brand">Nexus <span className="text-gradient">AI</span></h1>
                {phase === 'dashboard' && <button className="btn btn-secondary btn-sm glass" onClick={() => setPhase('selection')}>New Session</button>}
            </header>

            <main className="nexus-content">
                {phase === 'selection' && (
                    <div className="view-selection fade-in">
                        <section className="card-panel glass">
                            <h2 className="text-h2 mb-5">1. Strategic Goal</h2>
                            <div className="goal-list">
                                {[
                                    { id: 'revenue_growth', label: 'Revenue Growth', icon: '📈', color: '--success' },
                                    { id: 'cost_optimization', label: 'Cost Reduction', icon: '💰', color: '--primary' },
                                    { id: 'risk_mitigation', label: 'Risk Shield', icon: '🛡️', color: '--danger' },
                                    { id: 'operational_efficiency', label: 'Efficiency', icon: '⚙️', color: '--accent' },
                                ].map(obj => (
                                    <div
                                        key={obj.id}
                                        className={`goal-item hover-lift ${objective === obj.id ? 'active' : ''}`}
                                        onClick={() => setObjective(obj.id as StrategicObjective)}
                                        style={{
                                            borderColor: objective === obj.id ? `var(${obj.color})` : '',
                                            position: 'relative'
                                        }}
                                    >
                                        <span className="goal-icon" style={{ filter: objective === obj.id ? 'none' : 'grayscale(1)' }}>{obj.icon}</span>
                                        <span className="goal-text">{obj.label}</span>
                                        {objective === obj.id && <div className="pulse-success w-2 h-2 rounded-full absolute right-4"></div>}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="card-panel glass">
                            <h2 className="text-h2 mb-5">2. Data Streams</h2>
                            <div className="data-stack">
                                {groups.map(group => {
                                    const gFiles = files.filter(f => f.groupId === group.id);
                                    if (gFiles.length === 0) return null;
                                    const allS = gFiles.every(f => selectedFileIds.includes(f.id));
                                    return (
                                        <div key={group.id} className="data-group">
                                            <div className="data-group-head" onClick={() => {
                                                if (allS) setSelectedFileIds(prev => prev.filter(id => !gFiles.map(f => f.id).includes(id)));
                                                else setSelectedFileIds(prev => Array.from(new Set([...prev, ...gFiles.map(f => f.id)])));
                                            }}>
                                                <div className="flex items-center gap-2"><span>📂</span><b>{group.name}</b></div>
                                                <div className={`nexus-check ${allS ? 'on' : ''}`}></div>
                                            </div>
                                            <div className="data-file-box">
                                                {gFiles.map(f => (
                                                    <div key={f.id} className={`data-file hover-lift ${selectedFileIds.includes(f.id) ? 'on' : ''}`} onClick={() => setSelectedFileIds(prev => prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id])}>
                                                        <span>{f.filename}</span>
                                                        {selectedFileIds.includes(f.id) && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="tick">✓</motion.span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button className="btn btn-primary btn-lg w-full mt-10 glow-btn" onClick={runAnalysis} disabled={selectedFileIds.length === 0}>Generate Strategy</button>
                        </section>
                    </div>
                )}

                {phase === 'processing' && (
                    <div className="view-loading flex-col items-center justify-center fade-in">
                        <div className="nexus-orb-container">
                            <div className="nexus-orb"></div>
                            <div className="nexus-orb-ring"></div>
                        </div>
                        <h3 className="text-h2 mt-12" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Synthesizing Strategic Intelligence</h3>
                        <p className="text-sm font-mono mt-4 text-[var(--primary)]" style={{ opacity: 0.8 }}>
                            {logs[Math.min(Math.floor(analysisProgress / (100 / logs.length)), logs.length - 1)]}
                        </p>
                        <div className="nexus-bar-wrap mt-8">
                            <div className="nexus-bar-fill" style={{ width: `${analysisProgress}%` }}></div>
                        </div>
                    </div>
                )}

                {phase === 'dashboard' && (
                    <div className="view-dashboard fade-in">
                        <aside className="dash-sidebar">
                            <h4 className="dash-label mb-4">Discoveries</h4>
                            {insights.map(item => (
                                <div key={item.id} className={`dash-card ${selectedInsight?.id === item.id ? 'active' : ''}`} onClick={() => setSelectedInsight(item)}>
                                    <div className="flex justify-between items-center mb-1"><span className="badge">{item.category}</span><span className="impact">{item.impact}</span></div>
                                    <h5 className="dash-title">{item.title}</h5>
                                </div>
                            ))}
                        </aside>

                        <article className="dash-focus card glass">
                            {selectedInsight && (
                                <div className="focus-wrap">
                                    <div className="focus-header">
                                        <div className="flex justify-between items-start">
                                            <div><span className="dash-label text-primary">{selectedInsight.category} Target</span><h2 className="text-h1 mt-1">{selectedInsight.title}</h2></div>
                                            <div className="roi-pill"><span className="roi-label">Potential Impact</span><span className="roi-val">{selectedInsight.impact}</span></div>
                                        </div>
                                    </div>
                                    <div className="focus-metrics">
                                        <div className="metric"><span className="m-tag">AI CONFIDENCE</span><span className="m-val">{selectedInsight.confidence}%</span></div>
                                        <div className="metric"><span className="m-tag">STATUS</span><span className="m-val text-danger">{selectedInsight.status}</span></div>
                                        <div className="metric"><span className="m-tag">WINDOW</span><span className="m-val">IMMEDIATE</span></div>
                                    </div>
                                    <div className="focus-section">
                                        <h4 className="focus-title">The Strategic Rationale</h4>
                                        <p className="focus-text">{selectedInsight.desc}</p>
                                    </div>
                                    <div className="focus-section">
                                        <h4 className="focus-title">Execution Steps</h4>
                                        <div className="step-box">
                                            {selectedInsight.actions.map((act, i) => (
                                                <div key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-txt">{act}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="focus-footer">
                                        <button className="btn btn-secondary flex-1" onClick={() => addToast('Task Assigned to Department', 'info')}>Assign to Team</button>
                                        <button className="btn btn-primary flex-1 glow-btn" onClick={handleExecute} disabled={isExecuting}>
                                            {isExecuting ? 'Creating Project...' : 'Execute Strategy'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </article>
                    </div>
                )}
            </main>

            <style>{`
                .nexus-frame { height: 100%; width: 100%; padding: 32px; font-family: 'Dubai', sans-serif; display: flex; flex-direction: column; gap: 24px; color: var(--text-primary); }
                .nexus-canvas { position: fixed; inset: 0; background: radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 40%); z-index: -1; }
                .nexus-brand { font-size: 1.75rem; font-weight: 900; letter-spacing: -0.04em; }
                .glass { background: rgba(var(--bg-card-rgb), 0.5) !important; backdrop-filter: blur(16px); border: 1px solid var(--border-subtle); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
                
                .view-selection { display: grid; grid-template-columns: 320px 1fr; gap: 32px; }
                .goal-list { display: flex; flex-direction: column; gap: 10px; }
                .goal-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-default); cursor: pointer; transition: 0.2s; background: var(--bg-card); }
                .goal-item.active { border-color: var(--primary); background: var(--primary-subtle); transform: translateX(8px); }
                .goal-icon { font-size: 20px; }
                .goal-text { font-weight: 700; font-size: 0.95rem; }

                .data-stack { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
                .data-group { background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-subtle); overflow: hidden; }
                .data-group-head { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; background: rgba(var(--primary-rgb), 0.03); cursor: pointer; border-bottom: 1px solid var(--border-subtle); }
                .nexus-check { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--border-default); }
                .nexus-check.on { background: var(--primary); border-color: var(--primary); }
                .data-file-box { padding: 6px; }
                .data-file { padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; }
                .data-file:hover { background: var(--bg-surface); }
                .data-file.on { color: var(--primary); font-weight: 700; background: var(--primary-subtle); }

                .nexus-orb-container { position: relative; width: 80px; height: 80px; display: flex; items-center; justify-content: center; }
                .nexus-orb { width: 40px; height: 40px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 50px var(--primary); animation: glow 2s infinite alternate; z-index: 2; }
                .nexus-orb-ring { position: absolute; inset: -10px; border: 2px solid var(--primary-glow); border-radius: 50%; animation: spin 4s linear infinite; z-index: 1; }
                .nexus-orb-ring::before { content: ''; position: absolute; top: -5px; left: 50%; width: 10px; height: 10px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 15px var(--primary); }
                
                @keyframes glow { from { transform: scale(0.85); opacity: 0.7; } to { transform: scale(1.15); opacity: 1; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .nexus-bar-wrap { width: 320px; height: 4px; background: var(--bg-surface); border-radius: 2px; overflow: hidden; }
                .nexus-bar-fill { height: 100%; background: var(--primary); transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px var(--primary-glow); }

                .view-dashboard { display: grid; grid-template-columns: 340px 1fr; gap: 32px; height: calc(100vh - 160px); }
                .dash-sidebar { display: flex; flex-direction: column; gap: 14px; overflow-y: auto; padding-right: 8px; }
                .dash-label { font-size: 0.75rem; font-weight: 900; letter-spacing: 0.15em; color: var(--text-tertiary); text-transform: uppercase; }
                .dash-card { padding: 16px; border-radius: 12px; border: 1px solid var(--border-default); background: var(--bg-card); cursor: pointer; transition: 0.2s; }
                .dash-card.active { border-color: var(--primary); background: var(--primary-subtle); }
                .badge { font-size: 9px; font-weight: 900; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
                .impact { font-size: 10px; font-weight: 900; color: var(--success); }
                .dash-title { font-size: 1rem; font-weight: 800; margin-top: 6px; }

                .dash-focus { overflow-y: auto; padding: 40px !important; }
                .focus-wrap { display: flex; flex-direction: column; gap: 32px; }
                .roi-pill { text-align: right; }
                .roi-label { font-size: 9px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; display: block; }
                .roi-val { font-size: 2rem; font-weight: 900; color: var(--success); display: block; margin-top: -4px; }
                .focus-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
                .metric { padding: 14px; border-radius: 10px; background: var(--bg-app); border: 1px solid var(--border-subtle); }
                .m-tag { font-size: 8px; font-weight: 900; letter-spacing: 0.1em; color: var(--text-tertiary); display: block; margin-bottom: 2px; }
                .m-val { font-size: 1.1rem; font-weight: 900; }
                .focus-section { display: flex; flex-direction: column; gap: 12px; }
                .focus-title { font-size: 1.1rem; font-weight: 900; border-left: 4px solid var(--primary); padding-left: 14px; }
                .focus-text { font-size: 1rem; line-height: 1.6; color: var(--text-secondary); }
                .step-box { display: flex; flex-direction: column; gap: 10px; }
                .step-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: var(--bg-app); border-radius: 10px; border: 1px solid var(--border-subtle); }
                .step-num { width: 28px; height: 28px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-weight: 900; font-size: 12px; }
                .step-txt { font-weight: 700; font-size: 0.95rem; }
                .focus-footer { display: flex; gap: 16px; margin-top: 20px; }
                .glow-btn { box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2); }
            `}</style>
        </div>
    );
};
