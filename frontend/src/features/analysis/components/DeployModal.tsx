import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, FileDown, Share2, MessageSquare, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface DeployModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: any;
    onDeploy: (method: string, options: any) => void;
}

export const DeployModal = ({ isOpen, onClose, analysis, onDeploy }: DeployModalProps) => {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [slackChannel, setSlackChannel] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);

    const deploymentMethods = [
        {
            id: 'email',
            name: 'Email Report',
            description: 'Send executive summary via email',
            icon: Mail,
            color: '#3b82f6',
            available: true
        },
        {
            id: 'pdf',
            name: 'Export PDF',
            description: 'Download comprehensive report',
            icon: FileDown,
            color: '#10b981',
            available: true
        },
        {
            id: 'slack',
            name: 'Share to Slack',
            description: 'Post findings to team channel',
            icon: MessageSquare,
            color: '#8b5cf6',
            available: false // Enterprise feature
        },
    ];

    const handleDeploy = async () => {
        if (!selectedMethod) return;

        setIsDeploying(true);

        const options = {
            email: selectedMethod === 'email' ? email : undefined,
            slackChannel: selectedMethod === 'slack' ? slackChannel : undefined
        };

        await onDeploy(selectedMethod, options);

        setTimeout(() => {
            setIsDeploying(false);
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="card"
                    style={{
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        padding: '2rem'
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-h2 mb-2" style={{ fontSize: '24px' }}>Deploy Strategy</h2>
                            <p className="text-sm text-secondary">Choose how to share your strategic insights</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-icon btn-ghost"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Deployment Methods */}
                    <div className="flex-col gap-3 mb-6">
                        {deploymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => method.available && setSelectedMethod(method.id)}
                                disabled={!method.available}
                                className={`p-4 rounded-xl border-2 transition-all text-left w-full ${selectedMethod === method.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                    } ${!method.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="p-3 rounded-lg"
                                        style={{ background: `${method.color}15`, color: method.color }}
                                    >
                                        <method.icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold">{method.name}</h3>
                                            {!method.available && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-bold">
                                                    ENTERPRISE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-secondary">{method.description}</p>
                                    </div>
                                    {selectedMethod === method.id && (
                                        <CheckCircle size={20} className="text-primary" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Method-specific options */}
                    {selectedMethod === 'email' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6"
                        >
                            <label className="block mb-2 text-sm font-bold">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="executive@company.com"
                                className="input w-full"
                            />
                        </motion.div>
                    )}

                    {selectedMethod === 'slack' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6"
                        >
                            <label className="block mb-2 text-sm font-bold">Slack Channel</label>
                            <input
                                type="text"
                                value={slackChannel}
                                onChange={(e) => setSlackChannel(e.target.value)}
                                placeholder="#strategic-insights"
                                className="input w-full"
                            />
                        </motion.div>
                    )}

                    {/* Summary Preview */}
                    {selectedMethod && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card mb-6"
                            style={{ background: 'var(--bg-surface)', padding: '1rem' }}
                        >
                            <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Preview</p>
                            <p className="text-sm line-clamp-3">
                                {analysis?.executiveReasoning?.executiveSummary || 'Strategic insights from your analysis will be shared.'}
                            </p>
                        </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeploy}
                            disabled={!selectedMethod || isDeploying}
                            className="btn btn-primary flex-1"
                        >
                            {isDeploying ? 'Deploying...' : 'Deploy Now'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
