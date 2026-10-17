import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';

export const taskRoutes = Router();

// GET /api/tasks
taskRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const { status, priority, search } = req.query;
        const where: any = {};
        if (status && status !== 'all') where.status = status;
        if (priority && priority !== 'all') where.priority = priority;
        if (search) {
            where.OR = [
                { taskId: { contains: search as string } },
                { assignedWorker: { contains: search as string } },
                { notes: { contains: search as string } },
                { bin: { location: { contains: search as string } } },
                { bin: { binId: { contains: search as string } } },
            ];
        }
        const tasks = await prisma.collectionTask.findMany({
            where,
            include: { bin: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: tasks });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/tasks
taskRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const { binId, assignedWorker, priority, notes } = req.body;
        if (!binId) return res.status(400).json({ success: false, error: 'binId is required' });

        const bin = await prisma.bin.findUnique({ where: { id: binId } });
        if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });

        // Prevent duplicate active tasks
        const activeTask = await prisma.collectionTask.findFirst({
            where: {
                binId,
                status: { in: ['Pending', 'Assigned', 'In Progress'] },
            },
        });
        if (activeTask) {
            return res.status(409).json({
                success: false,
                error: `An active task (${activeTask.taskId}) already exists for this bin`,
            });
        }

        // Generate task ID
        const count = await prisma.collectionTask.count();
        const taskId = `TASK-${String(count + 1).padStart(3, '0')}`;

        const task = await prisma.collectionTask.create({
            data: {
                taskId,
                binId,
                assignedWorker: assignedWorker || null,
                priority: priority || 'Medium',
                status: assignedWorker ? 'Assigned' : 'Pending',
                notes: notes || null,
            },
            include: { bin: true },
        });

        await prisma.activityLog.create({
            data: {
                binId,
                action: 'TASK_CREATED',
                description: `Collection task ${taskId} created for ${bin.binId} at ${bin.location}`,
            },
        });

        res.status(201).json({ success: true, data: task });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/tasks/:id
taskRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const task = await prisma.collectionTask.findUnique({
            where: { id: req.params.id },
            include: { bin: true },
        });
        if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
        res.json({ success: true, data: task });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /api/tasks/:id
taskRoutes.put('/:id', async (req: Request, res: Response) => {
    try {
        const { assignedWorker, priority, status, notes } = req.body;
        const existing = await prisma.collectionTask.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

        const isCompleting = status === 'Completed' && existing.status !== 'Completed';
        const completedAt = isCompleting ? new Date() : existing.completedAt;

        const task = await prisma.collectionTask.update({
            where: { id: req.params.id },
            data: {
                assignedWorker: assignedWorker !== undefined ? assignedWorker : existing.assignedWorker,
                priority: priority || existing.priority,
                status: status || existing.status,
                notes: notes !== undefined ? notes : existing.notes,
                completedAt,
            },
            include: { bin: true },
        });

        if (isCompleting) {
            await prisma.activityLog.create({
                data: {
                    binId: existing.binId,
                    action: 'TASK_COMPLETED',
                    description: `Collection task ${existing.taskId} completed for ${task.bin?.binId} at ${task.bin?.location}`,
                },
            });
        } else {
            await prisma.activityLog.create({
                data: {
                    binId: existing.binId,
                    action: 'TASK_UPDATED',
                    description: `Task ${existing.taskId} updated: status=${status || existing.status}`,
                },
            });
        }

        res.json({ success: true, data: task });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});
