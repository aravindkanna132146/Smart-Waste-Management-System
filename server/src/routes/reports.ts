import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';

export const reportRoutes = Router();

// GET /api/reports/summary
reportRoutes.get('/summary', async (req: Request, res: Response) => {
    try {
        const [bins, tasks, alerts, logs] = await Promise.all([
            prisma.bin.findMany(),
            prisma.collectionTask.findMany({ include: { bin: true } }),
            prisma.alert.findMany({ where: { isResolved: false } }),
            prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { bin: true } }),
        ]);

        const summary = {
            totalBins: bins.length,
            normalBins: bins.filter((b) => b.status === 'Normal').length,
            nearlyFullBins: bins.filter((b) => b.status === 'Nearly Full').length,
            fullBins: bins.filter((b) => b.status === 'Full').length,
            pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
            assignedTasks: tasks.filter((t) => t.status === 'Assigned').length,
            inProgressTasks: tasks.filter((t) => t.status === 'In Progress').length,
            completedTasks: tasks.filter((t) => t.status === 'Completed').length,
            activeAlerts: alerts.length,
            criticalAlerts: alerts.filter((a) => a.alertLevel === 'Critical').length,
            warningAlerts: alerts.filter((a) => a.alertLevel === 'Warning').length,
            binsRequiringAttention: bins.filter((b) => b.status !== 'Normal'),
            recentActivity: logs,
        };
        res.json({ success: true, data: summary });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/reports/collections
reportRoutes.get('/collections', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const where: any = {};
        if (startDate) where.createdAt = { gte: new Date(startDate as string) };
        if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

        const tasks = await prisma.collectionTask.findMany({
            where,
            include: { bin: true },
            orderBy: { createdAt: 'desc' },
        });

        // Group by day
        const byDay: Record<string, number> = {};
        tasks.filter((t) => t.status === 'Completed' && t.completedAt).forEach((t) => {
            const day = t.completedAt!.toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + 1;
        });

        res.json({ success: true, data: { tasks, byDay } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/reports/export/bins - CSV export
reportRoutes.get('/export/bins', async (req: Request, res: Response) => {
    try {
        const bins = await prisma.bin.findMany({ orderBy: { createdAt: 'asc' } });
        const headers = ['Bin ID', 'Name', 'Location', 'Area', 'Fill %', 'Status', 'Latitude', 'Longitude', 'Last Updated', 'Created At'];
        const rows = bins.map((b) => [
            b.binId, b.name, b.location, b.area,
            b.fillPercentage, b.status,
            b.latitude ?? '', b.longitude ?? '',
            b.lastUpdated.toISOString(), b.createdAt.toISOString(),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bins_export.csv"');
        res.send(csv);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/reports/export/tasks - CSV export
reportRoutes.get('/export/tasks', async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.collectionTask.findMany({ include: { bin: true }, orderBy: { createdAt: 'asc' } });
        const headers = ['Task ID', 'Bin ID', 'Location', 'Worker', 'Priority', 'Status', 'Notes', 'Created At', 'Completed At'];
        const rows = tasks.map((t) => [
            t.taskId, t.bin?.binId || '', t.bin?.location || '',
            t.assignedWorker || '', t.priority, t.status,
            `"${(t.notes || '').replace(/"/g, '""')}"`,
            t.createdAt.toISOString(), t.completedAt ? t.completedAt.toISOString() : '',
        ]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks_export.csv"');
        res.send(csv);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/reports/export/alerts - CSV export
reportRoutes.get('/export/alerts', async (req: Request, res: Response) => {
    try {
        const alerts = await prisma.alert.findMany({ include: { bin: true }, orderBy: { createdAt: 'asc' } });
        const headers = ['Alert ID', 'Bin ID', 'Location', 'Fill %', 'Level', 'Acknowledged', 'Resolved', 'Created At'];
        const rows = alerts.map((a) => [
            a.id, a.bin?.binId || '', a.bin?.location || '',
            a.fillPercentage, a.alertLevel,
            a.isAcknowledged ? 'Yes' : 'No',
            a.isResolved ? 'Yes' : 'No',
            a.createdAt.toISOString(),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="alerts_export.csv"');
        res.send(csv);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});
