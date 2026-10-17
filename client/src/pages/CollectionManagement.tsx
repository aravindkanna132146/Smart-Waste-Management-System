import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Pencil, RefreshCw, Truck } from 'lucide-react';
import { getTasks, createTask, updateTask, getBins } from '../services/api';
import { CollectionTask, Bin } from '../types';
import { PriorityBadge, TaskStatusBadge, Spinner, EmptyState, formatDateTime } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';

type FilterStatus = 'all' | 'Pending' | 'Assigned' | 'In Progress' | 'Completed';

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">✕</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function TaskForm({
    bins,
    initial,
    onSave,
    onCancel,
    loading,
}: {
    bins: Bin[];
    initial?: Partial<CollectionTask>;
    onSave: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
}) {
    const [form, setForm] = useState({
        binId: initial?.binId || '',
        assignedWorker: initial?.assignedWorker || '',
        priority: initial?.priority || 'Medium',
        status: initial?.status || 'Pending',
        notes: initial?.notes || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.binId) { setErrors({ binId: 'Please select a bin' }); return; }
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!initial?.id && (
                <div>
                    <label className="form-label" htmlFor="task-bin">Select Bin *</label>
                    <select
                        id="task-bin"
                        className="form-input"
                        value={form.binId}
                        onChange={(e) => { setForm({ ...form, binId: e.target.value }); setErrors({}); }}
                    >
                        <option value="">-- Select a bin --</option>
                        {bins.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.binId} – {b.location} ({b.fillPercentage}% – {b.status})
                            </option>
                        ))}
                    </select>
                    {errors.binId && <p className="text-xs text-red-500 mt-1">{errors.binId}</p>}
                </div>
            )}
            <div>
                <label className="form-label" htmlFor="task-worker">Assigned Worker</label>
                <input
                    id="task-worker"
                    type="text"
                    className="form-input"
                    placeholder="Worker name (optional)"
                    value={form.assignedWorker}
                    onChange={(e) => setForm({ ...form, assignedWorker: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="form-label" htmlFor="task-priority">Priority</label>
                    <select
                        id="task-priority"
                        className="form-input"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    >
                        {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}
                    </select>
                </div>
                {initial?.id && (
                    <div>
                        <label className="form-label" htmlFor="task-status">Status</label>
                        <select
                            id="task-status"
                            className="form-input"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                        >
                            {['Pending', 'Assigned', 'In Progress', 'Completed'].map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div>
                <label className="form-label" htmlFor="task-notes">Notes</label>
                <textarea
                    id="task-notes"
                    className="form-input"
                    rows={3}
                    placeholder="Additional notes (optional)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
            </div>
            <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary btn" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-primary btn" disabled={loading}>
                    {loading ? <Spinner size={16} /> : null}
                    {initial?.id ? 'Save Changes' : 'Create Task'}
                </button>
            </div>
        </form>
    );
}

function TaskDetail({ task, onClose, onEdit }: { task: CollectionTask; onClose: () => void; onEdit: () => void }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
                {([
                    ['Task ID', task.taskId],
                    ['Bin ID', task.bin?.binId || task.binId],
                    ['Location', task.bin?.location || '–'],
                    ['Worker', task.assignedWorker || 'Unassigned'],
                    ['Priority', <PriorityBadge key="p" priority={task.priority} />],
                    ['Status', <TaskStatusBadge key="s" status={task.status} />],
                    ['Created', formatDateTime(task.createdAt)],
                    ['Completed', task.completedAt ? formatDateTime(task.completedAt) : '–'],
                ] as [string, any][]).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{k}</p>
                        <p className="font-medium mt-0.5">{v}</p>
                    </div>
                ))}
            </div>
            {task.notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p>{task.notes}</p>
                </div>
            )}
            <div className="flex gap-2 pt-2">
                <button className="btn-secondary btn flex-1" onClick={onClose}>Close</button>
                <button className="btn-primary btn flex-1" onClick={onEdit}><Pencil size={14} />Edit</button>
            </div>
        </div>
    );
}

export default function CollectionManagement() {
    const [tasks, setTasks] = useState<CollectionTask[]>([]);
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editTask, setEditTask] = useState<CollectionTask | null>(null);
    const [detailTask, setDetailTask] = useState<CollectionTask | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (search) params.search = search;
            const [tasksRes, binsRes] = await Promise.all([getTasks(params), getBins()]);
            setTasks(tasksRes.data.data);
            setBins(binsRes.data.data);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, search]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (data: any) => {
        setFormLoading(true);
        try {
            await createTask(data);
            addToast('Collection task created', 'success');
            setShowCreateModal(false);
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (data: any) => {
        if (!editTask) return;
        setFormLoading(true);
        try {
            await updateTask(editTask.id, data);
            addToast('Task updated', 'success');
            setEditTask(null);
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const filters: { value: FilterStatus; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Assigned', label: 'Assigned' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Completed', label: 'Completed' },
    ];

    return (
        <div className="p-6 space-y-5">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-900">Collection Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tasks found</p>
                </div>
                <button className="btn-primary btn" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} /> New Task
                </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks…"
                        className="form-input pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="task-search"
                    />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilterStatus(f.value)}
                            className={`btn btn-sm ${filterStatus === f.value ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <button className="btn-secondary btn btn-sm" onClick={load}><RefreshCw size={14} /></button>
            </div>

            <div className="card p-0">
                {loading ? (
                    <div className="flex justify-center py-16"><Spinner size={32} /></div>
                ) : tasks.length === 0 ? (
                    <EmptyState
                        icon={<Truck size={48} />}
                        title="No tasks found"
                        description="Create a task to assign collection work"
                        action={<button className="btn-primary btn" onClick={() => setShowCreateModal(true)}><Plus size={16} />New Task</button>}
                    />
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task ID</th>
                                    <th>Bin</th>
                                    <th>Location</th>
                                    <th>Worker</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td className="font-semibold text-green-700">{task.taskId}</td>
                                        <td>{task.bin?.binId || '–'}</td>
                                        <td>{task.bin?.location || '–'}</td>
                                        <td>{task.assignedWorker || <span className="text-gray-400 text-xs">Unassigned</span>}</td>
                                        <td><PriorityBadge priority={task.priority} /></td>
                                        <td><TaskStatusBadge status={task.status} /></td>
                                        <td className="text-xs text-gray-400">{formatDateTime(task.createdAt)}</td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className="btn-secondary btn btn-sm"
                                                    onClick={() => setDetailTask(task)}
                                                    title="View details"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    className="btn-secondary btn btn-sm"
                                                    onClick={() => setEditTask(task)}
                                                    title="Edit task"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <Modal title="New Collection Task" onClose={() => setShowCreateModal(false)}>
                    <TaskForm bins={bins} onSave={handleCreate} onCancel={() => setShowCreateModal(false)} loading={formLoading} />
                </Modal>
            )}

            {editTask && (
                <Modal title={`Edit Task – ${editTask.taskId}`} onClose={() => setEditTask(null)}>
                    <TaskForm bins={bins} initial={editTask} onSave={handleEdit} onCancel={() => setEditTask(null)} loading={formLoading} />
                </Modal>
            )}

            {detailTask && (
                <Modal title={`Task Details – ${detailTask.taskId}`} onClose={() => setDetailTask(null)}>
                    <TaskDetail
                        task={detailTask}
                        onClose={() => setDetailTask(null)}
                        onEdit={() => { setEditTask(detailTask); setDetailTask(null); }}
                    />
                </Modal>
            )}
        </div>
    );
}
