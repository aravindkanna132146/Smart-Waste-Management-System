import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getStatus(fill: number, warning = 70, critical = 90): string {
    if (fill >= critical) return 'Full';
    if (fill >= warning) return 'Nearly Full';
    return 'Normal';
}

async function main() {
    console.log('🌱 Seeding database...');

    // Check if already seeded
    const existingBins = await prisma.bin.count();
    if (existingBins > 0) {
        console.log('✅ Database already seeded, skipping...');
        return;
    }

    // Create app settings
    await prisma.appSetting.create({
        data: {
            appName: 'Smart Waste Management System',
            warningThreshold: 70,
            criticalThreshold: 90,
        },
    });

    // Sample bins data
    const binsData = [
        { binId: 'BIN-001', name: 'Main Gate Bin', location: 'Main Gate', area: 'Zone A', latitude: 13.0827, longitude: 80.2707, fillPercentage: 45 },
        { binId: 'BIN-002', name: 'Canteen Bin', location: 'College Canteen', area: 'Zone B', latitude: 13.0830, longitude: 80.2710, fillPercentage: 78 },
        { binId: 'BIN-003', name: 'Library Bin', location: 'Library Area', area: 'Zone A', latitude: 13.0825, longitude: 80.2715, fillPercentage: 23 },
        { binId: 'BIN-004', name: 'Parking Bin', location: 'Parking Area', area: 'Zone C', latitude: 13.0820, longitude: 80.2700, fillPercentage: 92 },
        { binId: 'BIN-005', name: 'Hostel Bin', location: 'Hostel Block', area: 'Zone D', latitude: 13.0840, longitude: 80.2720, fillPercentage: 85 },
        { binId: 'BIN-006', name: 'Sports Bin', location: 'Sports Ground', area: 'Zone C', latitude: 13.0815, longitude: 80.2695, fillPercentage: 60 },
    ];

    const bins = [];
    for (const b of binsData) {
        const status = getStatus(b.fillPercentage);
        const bin = await prisma.bin.create({
            data: {
                ...b,
                status,
                lastUpdated: new Date(),
            },
        });
        bins.push(bin);
        console.log(`  ✓ Created bin: ${bin.binId} - ${bin.location} (${bin.fillPercentage}% - ${bin.status})`);
    }

    // Create alerts for bins >= 70%
    let alertCount = 0;
    for (const bin of bins) {
        if (bin.fillPercentage >= 70) {
            const level = bin.fillPercentage >= 90 ? 'Critical' : 'Warning';
            await prisma.alert.create({
                data: {
                    binId: bin.id,
                    alertLevel: level,
                    fillPercentage: bin.fillPercentage,
                    message: `Bin ${bin.binId} at ${bin.location} is ${bin.fillPercentage}% full (${level})`,
                    isAcknowledged: false,
                    isResolved: false,
                },
            });
            alertCount++;
            console.log(`  ✓ Created ${level} alert for ${bin.binId}`);
        }
    }

    // Create sample collection tasks
    const tasksData = [
        { bin: bins[1], worker: 'Worker A', priority: 'High', status: 'Pending', notes: 'Bin near canteen needs immediate collection' },
        { bin: bins[3], worker: 'Worker B', priority: 'Urgent', status: 'In Progress', notes: 'Full bin at parking area' },
        { bin: bins[4], worker: 'Worker A', priority: 'High', status: 'Assigned', notes: 'Hostel bin approaching critical level' },
        { bin: bins[0], worker: null, priority: 'Low', status: 'Completed', notes: 'Routine collection' },
    ];

    let taskNum = 1;
    for (const t of tasksData) {
        const completedAt = t.status === 'Completed' ? new Date(Date.now() - 3600000) : null;
        await prisma.collectionTask.create({
            data: {
                taskId: `TASK-${String(taskNum).padStart(3, '0')}`,
                binId: t.bin.id,
                assignedWorker: t.worker,
                priority: t.priority,
                status: t.status,
                notes: t.notes,
                completedAt,
            },
        });
        console.log(`  ✓ Created task for ${t.bin.binId} - ${t.status}`);
        taskNum++;
    }

    // Activity logs
    await prisma.activityLog.createMany({
        data: [
            { binId: bins[0].id, action: 'BIN_CREATED', description: `Bin ${bins[0].binId} added to system`, createdAt: new Date(Date.now() - 86400000 * 3) },
            { binId: bins[3].id, action: 'ALERT_GENERATED', description: `Critical alert for ${bins[3].binId} at Parking Area`, createdAt: new Date(Date.now() - 3600000 * 2) },
            { binId: bins[1].id, action: 'TASK_CREATED', description: `Collection task created for ${bins[1].binId}`, createdAt: new Date(Date.now() - 3600000) },
            { binId: bins[0].id, action: 'TASK_COMPLETED', description: `Collection task completed for ${bins[0].binId}`, createdAt: new Date(Date.now() - 1800000) },
        ],
    });

    console.log('\n✅ Seeding complete!');
    console.log(`   - ${bins.length} bins created`);
    console.log(`   - ${alertCount} alerts created`);
    console.log(`   - ${tasksData.length} tasks created`);
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
