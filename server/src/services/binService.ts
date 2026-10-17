import { prisma } from './prisma';

export function getBinStatus(fill: number, warning = 70, critical = 90): string {
    if (fill >= critical) return 'Full';
    if (fill >= warning) return 'Nearly Full';
    return 'Normal';
}

export async function getSettings() {
    let settings = await prisma.appSetting.findFirst();
    if (!settings) {
        settings = await prisma.appSetting.create({ data: {} });
    }
    return settings;
}

export async function generateAlertForBin(binId: string, fill: number, warning: number, critical: number) {
    if (fill < warning) {
        // Resolve any active alerts for this bin
        await prisma.alert.updateMany({
            where: { binId, isResolved: false },
            data: { isResolved: true, resolvedAt: new Date() },
        });
        return null;
    }

    const level = fill >= critical ? 'Critical' : 'Warning';

    // Check for duplicate active alert at same level
    const existing = await prisma.alert.findFirst({
        where: { binId, alertLevel: level, isResolved: false },
    });
    if (existing) return existing;

    // Resolve old alerts at different level
    await prisma.alert.updateMany({
        where: { binId, isResolved: false },
        data: { isResolved: true, resolvedAt: new Date() },
    });

    const bin = await prisma.bin.findUnique({ where: { id: binId } });
    const alert = await prisma.alert.create({
        data: {
            binId,
            alertLevel: level,
            fillPercentage: fill,
            message: `Bin ${bin?.binId || binId} at ${bin?.location || 'unknown'} is ${fill}% full (${level})`,
        },
    });

    await prisma.activityLog.create({
        data: {
            binId,
            action: 'ALERT_GENERATED',
            description: `${level} alert generated for ${bin?.binId} at ${bin?.location}`,
        },
    });

    return alert;
}
