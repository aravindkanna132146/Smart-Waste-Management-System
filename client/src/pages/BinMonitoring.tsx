import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Plus, Search, Pencil, Trash2, Activity, Eye, RefreshCw, Truck, Package
} from 'lucide-react';
import { getBins, createBin, updateBin, deleteBin, simulateBin, createTask, emptyBin } from '../services/api';
import { Bin } from '../types';
import { FillBar, StatusBadge, Spinner, EmptyState, formatDateTime } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ToastContainer, useToast } from '../components/Toast';

type FilterStatus = 'all' | 'Normal' | 'Nearly Full' | 'Full';

function BinForm({
    initial,
    onSave,
    onCancel,
    loading,
}: {
    initial?: Partial<Bin>;
    onSave: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
}) {
    const [form, setForm] = useState({
        binId: initial?.binId || '',
        name: initial?.name || '',
        location: initial?.location || '',
        area: initial?.area || '',
        latitude: initial?.latitude?.toString() || '',
        longitude: initial?.longitude?.toString() || '',
        fillPercentage: initial?.fillPercentage?.toString() || '0',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.binId.trim()) e.binId = 'Bin ID is required';
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.location.trim()) e.location = 'Location is required';
        if (!form.area.trim()) e.area = 'Area is required';
        const fill = Number(form.fillPercentage);
        if (isNaN(fill) || fill < 0 || fill > 100) e.fillPercentage = 'Fill level must be 0–100';
        return e;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSave({
            ...form,
            fillPercentage: Number(form.fillPercentage),
            latitude: form.latitude ? Number(form.latitude) : null,
            longitude: form.longitude ? Number(form.longitude) : null,
        });
    };

    const field = (key: keyof typeof form, label: string, type = 'text', extra?: any) => (
        <div>
            <label className="form-label" htmlFor={key}>{label}</label>
            <input
                id={key}
                type={type}
                className="form-input"
                value={form[key]}
                onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }); }}
                {...extra}
            />
            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('binId', 'Bin ID *', 'text', { placeholder: 'BIN-007', disabled: !!initial?.binId })}
                {field('name', 'Bin Name *', 'text', { placeholder: 'Main Gate Bin' })}
                {field('location', 'Location *', 'text', { placeholder: 'Main Gate' })}
                {field('area', 'Area / Ward *', 'text', { placeholder: 'Zone A' })}
                {field('latitude', 'Latitude (optional)', 'number', { step: 'any', placeholder: '13.0827' })}
                {field('longitude', 'Longitude (optional)', 'number', { step: 'any', placeholder: '80.2707' })}
                <div className="sm:col-span-2">
                    <label className="form-label" htmlFor="fillPercentage">Fill Percentage (0–100)</label>
                    <input
                        id="fillPercentage"
                        type="number"
                        min={0}
                        max={100}
                        className="form-input"
                        value={form.fillPercentage}
                        onChange={(e) => { setForm({ ...form, fillPercentage: e.target.value }); setErrors({ ...errors, fillPercentage: '' }); }}
                    />
                    {errors.fillPercentage && <p className="text-xs text-red-500 mt-1">{errors.fillPercentage}</p>}
                </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary btn" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-primary btn" disabled={loading}>
                    {loading ? <Spinner size={16} /> : null}
                    {initial?.id ? 'Save Changes' : 'Add Bin'}
                </button>
            </div>
        </form>
    );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">✕</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default function BinMonitoring() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<Bin | null>(null);
    const [showDetailModal, setShowDetailModal] = useState<Bin | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Bin | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [simulatingId, setSimulatingId] = useState<string | null>(null);
    const [taskLoading, setTaskLoading] = useState<string | null>(null);
    const [emptyLoading, setEmptyLoading] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (search) params.search = search;
            const res = await getBins(params);
            setBins(res.data.data);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, search]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async (data: any) => {
        setFormLoading(true);
        try {
            await createBin(data);
            addToast('Bin added successfully', 'success');
            setShowAddModal(false);
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (data: any) => {
        if (!showEditModal) return;
        setFormLoading(true);
        try {
            await updateBin(showEditModal.id, data);
            addToast('Bin updated successfully', 'success');
            setShowEditModal(null);
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await deleteBin(showDeleteConfirm.id);
            addToast(`Bin ${showDeleteConfirm.binId} deleted`, 'success');
            setShowDeleteConfirm(null);
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        }
    };

    const handleSimulate = async (bin: Bin) => {
        setSimulatingId(bin.id);
        try {
            const res = await simulateBin(bin.id);
            addToast(res.data.message, 'success');
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setSimulatingId(null);
        }
    };

    const handleCreateTask = async (bin: Bin) => {
        setTaskLoading(bin.id);
        try {
            await createTask({ binId: bin.id, priority: bin.status === 'Full' ? 'Urgent' : 'High' });
            addToast(`Task created for ${bin.binId}`, 'success');
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setTaskLoading(null);
        }
    };

    const handleEmptyBin = async (bin: Bin) => {
        setEmptyLoading(bin.id);
        try {
            await emptyBin(bin.id);
            addToast(`Bin ${bin.binId} marked as emptied`, 'success');
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setEmptyLoading(null);
        }
    };

    const filters: { value: FilterStatus; label: string }[] = [
        { value: 'all', label: 'All Bins' },
        { value: 'Normal', label: 'Normal' },
        { value: 'Nearly Full', label: 'Nearly Full' },
        { value: 'Full', label: 'Full' },
    ];

    return (
        <div className="p-6 space-y-5">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-900">Bin Monitoring</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{bins.length} bins registered</p>
                </div>
                <button className="btn-primary btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> Add Bin
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search bins…"
                        className="form-input pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="bin-search"
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
                <button className="btn-secondary btn btn-sm ml-auto" onClick={load}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Table */}
            <div className="card p-0">
                {loading ? (
                    <div className="flex justify-center py-16"><Spinner size={32} /></div>
                ) : bins.length === 0 ? (
                    <EmptyState
                        icon={<Trash2 size={48} />}
                        title="No bins found"
                        description="Add a new bin to start monitoring"
                        action={<button className="btn-primary btn" onClick={() => setShowAddModal(true)}><Plus size={16} />Add Bin</button>}
                    />
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Bin ID</th>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Area</th>
                                    <th>Fill Level</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bins.map((bin) => (
                                    <tr key={bin.id}>
                                        <td className="font-semibold text-green-700">{bin.binId}</td>
                                        <td>{bin.name}</td>
                                        <td>{bin.location}</td>
                                        <td><span className="badge badge-gray">{bin.area}</span></td>
                                        <td className="min-w-[140px]"><FillBar percentage={bin.fillPercentage} /></td>
                                        <td><StatusBadge status={bin.status} /></td>
                                        <td className="text-xs text-gray-400">{formatDateTime(bin.lastUpdated)}</td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    title="View details"
                                                    className="btn-secondary btn btn-sm"
                                                    onClick={() => setShowDetailModal(bin)}
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    title="Edit"
                                                    className="btn-secondary btn btn-sm"
                                                    onClick={() => setShowEditModal(bin)}
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    title="Simulate sensor"
                                                    className="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    onClick={() => handleSimulate(bin)}
                                                    disabled={simulatingId === bin.id}
                                                >
                                                    {simulatingId === bin.id ? <Spinner size={13} /> : <Activity size={13} />}
                                                </button>
                                                {bin.status !== 'Normal' && (
                                                    <button
                                                        title="Create collection task"
                                                        className="btn btn-sm bg-amber-50 text-amber-600 hover:bg-amber-100"
                                                        onClick={() => handleCreateTask(bin)}
                                                        disabled={taskLoading === bin.id}
                                                    >
                                                        {taskLoading === bin.id ? <Spinner size={13} /> : <Truck size={13} />}
                                                    </button>
                                                )}
                                                {bin.status !== 'Normal' && (
                                                    <button
                                                        title="Mark bin emptied"
                                                        className="btn btn-sm bg-green-50 text-green-600 hover:bg-green-100"
                                                        onClick={() => handleEmptyBin(bin)}
                                                        disabled={emptyLoading === bin.id}
                                                    >
                                                        {emptyLoading === bin.id ? <Spinner size={13} /> : <Package size={13} />}
                                                    </button>
                                                )}
                                                <button
                                                    title="Delete bin"
                                                    className="btn-danger btn btn-sm"
                                                    onClick={() => setShowDeleteConfirm(bin)}
                                                >
                                                    <Trash2 size={13} />
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

            {/* Modals */}
            {showAddModal && (
                <Modal title="Add New Bin" onClose={() => setShowAddModal(false)}>
                    <BinForm onSave={handleAdd} onCancel={() => setShowAddModal(false)} loading={formLoading} />
                </Modal>
            )}

            {showEditModal && (
                <Modal title={`Edit ${showEditModal.binId}`} onClose={() => setShowEditModal(null)}>
                    <BinForm initial={showEditModal} onSave={handleEdit} onCancel={() => setShowEditModal(null)} loading={formLoading} />
                </Modal>
            )}

            {showDetailModal && (
                <Modal title={`Bin Details – ${showDetailModal.binId}`} onClose={() => setShowDetailModal(null)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                ['Bin ID', showDetailModal.binId],
                                ['Name', showDetailModal.name],
                                ['Location', showDetailModal.location],
                                ['Area', showDetailModal.area],
                                ['Status', <StatusBadge key="s" status={showDetailModal.status} />],
                                ['Last Updated', formatDateTime(showDetailModal.lastUpdated)],
                                ['Latitude', showDetailModal.latitude?.toString() || 'Not set'],
                                ['Longitude', showDetailModal.longitude?.toString() || 'Not set'],
                            ].map(([k, v]) => (
                                <div key={k as string} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">{k}</p>
                                    <p className="font-medium mt-0.5">{v}</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Fill Level</p>
                            <FillBar percentage={showDetailModal.fillPercentage} />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button className="btn-secondary btn flex-1" onClick={() => { setShowEditModal(showDetailModal); setShowDetailModal(null); }}>
                                <Pencil size={14} /> Edit
                            </button>
                            <button
                                className="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100 flex-1"
                                onClick={() => { handleSimulate(showDetailModal); setShowDetailModal(null); }}
                            >
                                <Activity size={14} /> Simulate Sensor
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete Bin"
                    message={`Are you sure you want to delete ${showDeleteConfirm.binId} at ${showDeleteConfirm.location}? All associated alerts and tasks will also be removed.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(null)}
                />
            )}
        </div>
    );
}
