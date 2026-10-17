import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';

export const alertRoutes = Router();

// GET /api/alerts
alertRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const { level, acknowledged, resolved } = req.query;
        const where: any = {};
        if (level) where.alertLevel = level;
        if (acknowledged !== undefined) where.isAcknowledged = acknowledged === 'true';
        if (resolved !== undefined) where.isResolved = resolved === 'true';
        else where.isResolved = false; // Default: show active alerts

        const alerts = await prisma.alert.findMany({
            where,
            include: { bin: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: alerts });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/alerts/:id/acknowledge
alertRoutes.post('/:id/acknowledge', async (req: Request, res: Response) => {
    try {
        const alert = await prisma.alert.findUnique({ where: { id: req.params.id } });
        if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });

        const updated = await prisma.alert.update({
            where: { id: req.params.id },
            data: { isAcknowledged: true, acknowledgedAt: new Date() },
            include: { bin: true },
        });

        await prisma.activityLog.create({
            data: {
                binId: alert.binId,
                action: 'ALERT_ACKNOWLEDGED',
                description: `Alert for ${updated.bin?.binId} acknowledged`,
            },
        });

        res.json({ success: true, data: updated, message: 'Alert acknowledged' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET all alerts including resolved (for history)
alertRoutes.get('/all', async (req: Request, res: Response) => {
    try {
        const alerts = await prisma.alert.findMany({
            include: { bin: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: alerts });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});
