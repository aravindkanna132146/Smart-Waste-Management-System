import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';

export const settingsRoutes = Router();

// GET /api/settings
settingsRoutes.get('/', async (req: Request, res: Response) => {
    try {
        let settings = await prisma.appSetting.findFirst();
        if (!settings) {
            settings = await prisma.appSetting.create({ data: {} });
        }
        res.json({ success: true, data: settings });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /api/settings
settingsRoutes.put('/', async (req: Request, res: Response) => {
    try {
        const { appName, warningThreshold, criticalThreshold } = req.body;
        const wt = Number(warningThreshold);
        const ct = Number(criticalThreshold);

        if (warningThreshold !== undefined && criticalThreshold !== undefined) {
            if (wt >= ct) {
                return res.status(400).json({
                    success: false,
                    error: 'Warning threshold must be lower than critical threshold',
                });
            }
            if (wt < 1 || wt > 99 || ct < 1 || ct > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Thresholds must be between 1 and 100',
                });
            }
        }

        let settings = await prisma.appSetting.findFirst();
        if (!settings) {
            settings = await prisma.appSetting.create({ data: {} });
        }

        const updated = await prisma.appSetting.update({
            where: { id: settings.id },
            data: {
                appName: appName !== undefined ? appName : settings.appName,
                warningThreshold: warningThreshold !== undefined ? wt : settings.warningThreshold,
                criticalThreshold: criticalThreshold !== undefined ? ct : settings.criticalThreshold,
            },
        });

        // Re-compute bin statuses if thresholds changed
        if (warningThreshold !== undefined || criticalThreshold !== undefined) {
            const bins = await prisma.bin.findMany();
            for (const bin of bins) {
                let status = 'Normal';
                if (bin.fillPercentage >= updated.criticalThreshold) status = 'Full';
                else if (bin.fillPercentage >= updated.warningThreshold) status = 'Nearly Full';
                await prisma.bin.update({ where: { id: bin.id }, data: { status } });
            }
        }

        res.json({ success: true, data: updated, message: 'Settings updated successfully' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});
