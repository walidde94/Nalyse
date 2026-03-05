import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Webhook, Trash2, Edit2, Play, Check, X } from 'lucide-react';

interface WebhookType {
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
}

export const WebhooksTab = () => {
    const { addToast } = useToast();
    const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: ['analysis.completed'] });

    const fetchWebhooks = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/automation/webhooks');
            setWebhooks(res.data);
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to fetch webhooks', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const createWebhook = async () => {
        try {
            // Add some basic validation
            if (!newWebhook.url.startsWith('https://') && !newWebhook.url.startsWith('http://')) {
                addToast('Webhook URL must be valid HTTP/HTTPS', 'error');
                return;
            }
            const res = await api.post('/automation/webhooks', newWebhook);
            setWebhooks([...webhooks, res.data]);
            setIsCreating(false);
            setNewWebhook({ name: '', url: '', events: ['analysis.completed'] });
            addToast('Webhook created successfully', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to create webhook', 'error');
        }
    };

    const deleteWebhook = async (id: string) => {
        try {
            await api.delete(`/automation/webhooks/${id}`);
            setWebhooks(webhooks.filter(w => w.id !== id));
            addToast('Webhook deleted', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Failed to delete webhook', 'error');
        }
    };

    const toggleStatus = async (webhook: WebhookType) => {
        // Optimistic UI, but here we don't have a PUT route defined for webhooks (only DELETE and POST)
        // Would need to add PUT route to toggle. Added in backend? Wait, didn't add the PUT route for webhooks in automation.ts
        addToast('Toggle feature requires backend PUT endpoint implementaton in Sprint 7', 'warning');
    };

    if (isLoading) return <div className="text-secondary p-6">Loading webhooks...</div>;

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative max-h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Webhook className="text-amber-500" />
                    Outgoing Webhooks
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary bg-amber-600 hover:bg-amber-500 shadow-glow-amber text-white font-bold"
                >
                    Add Webhook
                </button>
            </div>

            {isCreating && (
                <div className="card border border-amber-500/30 p-4 mb-4 bg-amber-500/5">
                    <h3 className="font-bold mb-3">New Webhook Endpoint</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Webhook Name (e.g. Slack Notify)"
                            value={newWebhook.name}
                            onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })}
                            className="input bg-black/20 font-medium"
                        />
                        <input
                            type="url"
                            placeholder="Endpoint URL (https://...)"
                            value={newWebhook.url}
                            onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                            className="input bg-black/20 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={createWebhook} className="btn bg-amber-500 text-white font-bold">Deploy</button>
                        <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {webhooks.length === 0 && !isCreating && (
                    <div className="p-8 text-center text-secondary border border-dashed border-[var(--border-default)] rounded-xl">
                        No webhooks found. Forward events to Slack, Zapier, or custom APIs.
                    </div>
                )}
                {webhooks.map(webhook => (
                    <div key={webhook.id} className="card p-4 flex items-center justify-between border border-[var(--border-subtle)] hover:border-amber-500/30 transition-colors">
                        <div>
                            <div className="font-bold flex items-center gap-2">
                                {webhook.name}
                                {webhook.isActive ? (
                                    <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">Active</span>
                                ) : (
                                    <span className="bg-white/10 text-secondary text-xs px-2 py-0.5 rounded-full border border-white/10">Disabled</span>
                                )}
                            </div>
                            <div className="text-xs text-secondary mt-1 font-mono break-all opacity-70">
                                {webhook.url}
                            </div>
                            <div className="flex gap-1 mt-2">
                                {webhook.events.map(ev => (
                                    <span key={ev} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-secondary font-mono">
                                        {ev}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => deleteWebhook(webhook.id)} className="btn btn-icon text-rose-500 hover:bg-rose-500/20">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
