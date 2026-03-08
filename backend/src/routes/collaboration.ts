import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// In-memory store for collaboration (would be DB in production)
let comments: any[] = [
    { id: 'c1', dashboardId: 'dash-1', userId: 'system', userName: 'Nalyse AI', text: 'Revenue metrics are trending 12% above forecast. Consider adjusting Q2 targets.', timestamp: new Date(Date.now() - 3600000).toISOString(), reactions: { '🔥': 3, '👍': 5 } },
    { id: 'c2', dashboardId: 'dash-1', userId: 'user-1', userName: 'Alice Chen', text: '@bob Can you verify the APAC numbers? They look unusually high this quarter.', timestamp: new Date(Date.now() - 1800000).toISOString(), reactions: { '👀': 2 } },
    { id: 'c3', dashboardId: 'dash-1', userId: 'user-2', userName: 'Bob Smith', text: 'Verified — the spike is from the new enterprise contract signed last week. All legitimate.', timestamp: new Date(Date.now() - 900000).toISOString(), reactions: { '✅': 4 } },
];

let sharedDashboards: any[] = [
    { id: 'sd-1', name: 'Q4 Revenue Overview', owner: 'Alice Chen', sharedWith: ['Bob Smith', 'Charlie Lee'], lastEdited: new Date(Date.now() - 7200000).toISOString(), viewers: 12, status: 'live' },
    { id: 'sd-2', name: 'Marketing Performance', owner: 'Diana Prince', sharedWith: ['Alice Chen'], lastEdited: new Date(Date.now() - 86400000).toISOString(), viewers: 5, status: 'draft' },
    { id: 'sd-3', name: 'Engineering KPIs', owner: 'Bob Smith', sharedWith: ['Alice Chen', 'Charlie Lee', 'Diana Prince'], lastEdited: new Date(Date.now() - 3600000).toISOString(), viewers: 8, status: 'live' },
];

let activityFeed: any[] = [
    { id: 'a1', user: 'Alice Chen', action: 'commented on', target: 'Q4 Revenue Overview', time: new Date(Date.now() - 300000).toISOString(), type: 'comment' },
    { id: 'a2', user: 'Bob Smith', action: 'shared', target: 'Engineering KPIs', time: new Date(Date.now() - 1200000).toISOString(), type: 'share' },
    { id: 'a3', user: 'Nalyse AI', action: 'detected anomaly in', target: 'Marketing Performance', time: new Date(Date.now() - 3600000).toISOString(), type: 'alert' },
    { id: 'a4', user: 'Charlie Lee', action: 'edited', target: 'Q4 Revenue Overview', time: new Date(Date.now() - 7200000).toISOString(), type: 'edit' },
    { id: 'a5', user: 'Diana Prince', action: 'exported', target: 'Marketing Performance', time: new Date(Date.now() - 14400000).toISOString(), type: 'export' },
];

// Get shared dashboards
router.get('/dashboards', authenticate, (req: Request, res: Response) => {
    res.json({ success: true, dashboards: sharedDashboards });
});

// Get comments for a dashboard
router.get('/comments/:dashboardId', authenticate, (req: Request, res: Response) => {
    const { dashboardId } = req.params;
    const filtered = comments.filter(c => c.dashboardId === dashboardId);
    res.json({ success: true, comments: filtered });
});

// Add a comment
router.post('/comments', authenticate, (req: Request, res: Response) => {
    const { dashboardId, text } = req.body;
    const user = (req as any).user;
    const comment = {
        id: `c-${Date.now()}`,
        dashboardId,
        userId: user?.id || 'anonymous',
        userName: user?.name || user?.email || 'Anonymous',
        text,
        timestamp: new Date().toISOString(),
        reactions: {}
    };
    comments.push(comment);
    res.json({ success: true, comment });
});

// Get activity feed
router.get('/activity', authenticate, (req: Request, res: Response) => {
    res.json({ success: true, activity: activityFeed });
});

// Share a dashboard
router.post('/share', authenticate, (req: Request, res: Response) => {
    const { dashboardId, emails } = req.body;
    const dashboard = sharedDashboards.find(d => d.id === dashboardId);
    if (dashboard) {
        dashboard.sharedWith = [...new Set([...dashboard.sharedWith, ...emails])];
    }
    res.json({ success: true, message: 'Dashboard shared successfully' });
});

// Generate share link
router.post('/share-link', authenticate, (req: Request, res: Response) => {
    const token = `nal_share_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    res.json({ success: true, shareLink: `https://nalyse.app/shared/${token}`, expiresIn: '7 days' });
});

export default router;
