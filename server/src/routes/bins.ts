import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { getBinStatus, generateAlertForBin, getSettings } from '../services/binService';

export const binRoutes = Router();

// GET /api/bins - List all bins
binRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const { status, search } = req.query;
        const where: any = {};
        if (status && status !== 'all') where.status = status;
        if (search) {
            where.OR = [
                { binId: { contains: search as string } },
                { name: { contains: search as string } },
                { location: { contains: search as string } },
                { area: { contains: search as string } },
            ];
        }
        const bins = await prisma.bin.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });
        res.json({ success: true, data: bins });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/bins - Create bin
binRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const { binId, name, location, area, latitude, longitude, fillPercentage } = req.body;
        if (!binId || !name || !location || !area) {
            return res.status(400).json({ success: false, error: 'binId, name, location, and area are required' });
        }
        const fill = Math.max(0, Math.min(100, Number(fillPercentage) || 0));

        const settings = await getSettings();
        const status = getBinStatus(fill, settings.warningThreshold, settings.criticalThreshold);

        // Check for duplicate binId
        const existing = await prisma.bin.findUnique({ where: { binId } });
        if (existing) return res.status(409).json({ success: false, error: `Bin ID ${binId} already exists` });

        const bin = await prisma.bin.create({
            data: {
                binId,
                name,
                location,
                area,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                fillPercentage: fill,
                status,
                lastUpdated: new Date(),
            },
        });

        await prisma.activityLog.create({
            data: { binId: bin.id, action: 'BIN_CREATED', description: `New bin ${bin.binId} added at ${bin.location}` },
        });

        if (fill >= settings.warningThreshold) {
            await generateAlertForBin(bin.id, fill, settings.warningThreshold, settings.criticalThreshold);
        }

        res.status(201).json({ success: true, data: bin });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/bins/:id
binRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const bin = await prisma.bin.findUnique({
            where: { id: req.params.id },
            include: {
                alerts: { orderBy: { createdAt: 'desc' }, take: 5 },
                tasks: { orderBy: { createdAt: 'desc' }, take: 5 },
                logs: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });
        res.json({ success: true, data: bin });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /api/bins/:id
binRoutes.put('/:id', async (req: Request, res: Response) => {
    try {
        const { name, location, area, latitude, longitude, fillPercentage } = req.body;
        const fill = fillPercentage !== undefined ? Math.max(0, Math.min(100, Number(fillPercentage))) : undefined;
        const settings = await getSettings();

        const existing = await prisma.bin.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Bin not found' });

        const newFill = fill !== undefined ? fill : existing.fillPercentage;
        const status = getBinStatus(newFill, settings.warningThreshold, settings.criticalThreshold);

        const bin = await prisma.bin.update({
            where: { id: req.params.id },
            data: {
                name: name || existing.name,
                location: location || existing.location,
                area: area || existing.area,
                latitude: latitude !== undefined ? (latitude ? Number(latitude) : null) : existing.latitude,
                longitude: longitude !== undefined ? (longitude ? Number(longitude) : null) : existing.longitude,
                fillPercentage: newFill,
                status,
                lastUpdated: new Date(),
            },
        });

        if (fill !== undefined) {
            await generateAlertForBin(bin.id, newFill, settings.warningThreshold, settings.criticalThreshold);
        }

        await prisma.activityLog.create({
            data: { binId: bin.id, action: 'BIN_UPDATED', description: `Bin ${bin.binId} updated` },
        });

        res.json({ success: true, data: bin });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /api/bins/:id
binRoutes.delete('/:id', async (req: Request, res: Response) => {
    try {
        const bin = await prisma.bin.findUnique({ where: { id: req.params.id } });
        if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });

        await prisma.bin.delete({ where: { id: req.params.id } });

        await prisma.activityLog.create({
            data: { action: 'BIN_DELETED', description: `Bin ${bin.binId} at ${bin.location} was removed` },
        });

        res.json({ success: true, message: `Bin ${bin.binId} deleted successfully` });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/bins/:id/simulate - Simulate sensor reading
binRoutes.post('/:id/simulate', async (req: Request, res: Response) => {
    try {
        const bin = await prisma.bin.findUnique({ where: { id: req.params.id } });
        if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });

        const settings = await getSettings();
        // Generate realistic random fill: weighted towards current level ± variance
        const variance = Math.floor(Math.random() * 30) - 10;
        const newFill = Math.max(0, Math.min(100, Math.round(bin.fillPercentage + variance)));
        const status = getBinStatus(newFill, settings.warningThreshold, settings.criticalThreshold);

        const updated = await prisma.bin.update({
            where: { id: req.params.id },
            data: { fillPercentage: newFill, status, lastUpdated: new Date() },
        });

        await generateAlertForBin(bin.id, newFill, settings.warningThreshold, settings.criticalThreshold);

        await prisma.activityLog.create({
            data: {
                binId: bin.id,
                action: 'SENSOR_SIMULATION',
                description: `Simulated sensor reading for ${bin.binId}: ${newFill}% (was ${bin.fillPercentage}%)`,
            },
        });

        res.json({ success: true, data: updated, message: `Simulated reading: ${newFill}%` });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/bins/simulate-all
binRoutes.post('/simulate-all', async (req: Request, res: Response) => {
    try {
        const settings = await getSettings();
        const bins = await prisma.bin.findMany();
        const results = [];

        for (const bin of bins) {
            const variance = Math.floor(Math.random() * 40) - 15;
            const newFill = Math.max(0, Math.min(100, Math.round(bin.fillPercentage + variance)));
            const status = getBinStatus(newFill, settings.warningThreshold, settings.criticalThreshold);

            const updated = await prisma.bin.update({
                where: { id: bin.id },
                data: { fillPercentage: newFill, status, lastUpdated: new Date() },
            });

            await generateAlertForBin(bin.id, newFill, settings.warningThreshold, settings.criticalThreshold);
            results.push(updated);
        }

        await prisma.activityLog.create({
            data: { action: 'BULK_SIMULATION', description: `Simulated sensor readings for all ${bins.length} bins` },
        });

        res.json({ success: true, data: results, message: `Simulated readings for ${bins.length} bins` });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/bins/:id/empty - Mark bin as emptied
binRoutes.post('/:id/empty', async (req: Request, res: Response) => {
    try {
        const bin = await prisma.bin.findUnique({ where: { id: req.params.id } });
        if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });

        const updated = await prisma.bin.update({
            where: { id: req.params.id },
            data: { fillPercentage: 0, status: 'Normal', lastUpdated: new Date() },
        });

        // Resolve active alerts
        await prisma.alert.updateMany({
            where: { binId: bin.id, isResolved: false },
            data: { isResolved: true, resolvedAt: new Date() },
        });

        await prisma.activityLog.create({
            data: {
                binId: bin.id,
                action: 'BIN_EMPTIED',
                description: `Bin ${bin.binId} at ${bin.location} was manually marked as emptied`,
            },
        });

        res.json({ success: true, data: updated, message: `Bin ${bin.binId} marked as emptied` });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});
