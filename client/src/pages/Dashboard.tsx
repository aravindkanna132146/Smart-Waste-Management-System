import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, CheckCircle, AlertTriangle, TrendingUp,
    Clock, RefreshCw, Plus, Activity
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getDashboardSummary, createTask, simulateAll } from '../services/api';
import { DashboardSummary, Bin } from '../types';
import { FillBar, StatusBadge, Spinner, timeAgo, LoadingCard } from '../components/ui';
import { useToast } from '../components/Toast';
import { ToastContainer } from '../components/Toast';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

function StatCard({ label, value, icon: Icon, color, subtext }: {
    label: string; value: number; icon: any; color: string; subtext?: string;
}) {
    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100').replace('800', '100')}`}>
                    <Icon size={22} className={color} />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [taskBinId, setTaskBinId] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getDashboardSummary();
            setSummary(res.data.data);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSimulateAll = async () => {
        setSimulating(true);
        try {
            await simulateAll();
            addToast('Simulated sensor readings for all bins', 'success');
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setSimulating(false);
        }
    };

    const handleCreateTask = async (bin: Bin) => {
        setTaskBinId(bin.id);
        try {
            await createTask({ binId: bin.id, priority: bin.status === 'Full' ? 'Urgent' : 'High' });
            addToast(`Collection task created for ${bin.binId}`, 'success');
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setTaskBinId(null);
        }
    };

    const pieData = summary ? [
        { name: 'Normal', value: summary.normalBins },
        { name: 'Nearly Full', value: summary.nearlyFullBins },
        { name: 'Full', value: summary.fullBins },
    ].filter(d => d.value > 0) : [];

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {Array(6).fill(0).map((_, i) => <LoadingCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Real-time waste management overview</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button className="btn-secondary btn btn-sm" onClick={load}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                        className="btn-primary btn btn-sm"
                        onClick={handleSimulateAll}
                        disabled={simulating}
                    >
                        {simulating ? <Spinner size={14} /> : <Activity size={14} />}
                        Simulate All Sensors
                    </button>
                </div>
            </div>

            {/* Simulation notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <Activity size={16} />
                <strong>Note:</strong>&nbsp;This system uses <b>simulated sensor readings</b>. No physical IoT devices are connected.
            </div>

            {/* Stat cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard label="Total Bins" value={summary.totalBins} icon={Trash2} color="text-gray-700" />
                    <StatCard label="Normal" value={summary.normalBins} icon={CheckCircle} color="text-green-600" />
                    <StatCard label="Nearly Full" value={summary.nearlyFullBins} icon={AlertTriangle} color="text-amber-600" />
                    <StatCard label="Full" value={summary.fullBins} icon={AlertTriangle} color="text-red-600" />
                    <StatCard label="Pending Tasks" value={summary.pendingTasks + summary.assignedTasks + summary.inProgressTasks} icon={Clock} color="text-blue-600" />
                    <StatCard label="Completed" value={summary.completedTasks} icon={CheckCircle} color="text-green-700" subtext="all time" />
                </div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Bin Status Distribution</h2>
                    {pieData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No bins registered</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Bins']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Task summary bar chart */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Collection Task Summary</h2>
                    {summary && (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={[
                                    { name: 'Pending', count: summary.pendingTasks, fill: '#94a3b8' },
                                    { name: 'Assigned', count: summary.assignedTasks, fill: '#60a5fa' },
                                    { name: 'In Progress', count: summary.inProgressTasks, fill: '#f59e0b' },
                                    { name: 'Completed', count: summary.completedTasks, fill: '#22c55e' },
                                ]}
                                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {[
                                        { name: 'Pending', fill: '#94a3b8' },
                                        { name: 'Assigned', fill: '#60a5fa' },
                                        { name: 'In Progress', fill: '#f59e0b' },
                                        { name: 'Completed', fill: '#22c55e' },
                                    ].map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bins requiring attention */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-900">Bins Requiring Attention</h2>
                        <span className="badge badge-red">{summary?.binsRequiringAttention.length || 0}</span>
                    </div>
                    {!summary?.binsRequiringAttention.length ? (
                        <div className="py-8 text-center text-sm text-gray-400">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                            All bins are in normal condition!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {summary.binsRequiringAttention.map((bin) => (
                                <div
                                    key={bin.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer group"
                                    onClick={() => navigate(`/bins?highlight=${bin.id}`)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm text-gray-900">{bin.binId}</span>
                                            <StatusBadge status={bin.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{bin.location} · {bin.area}</p>
                                        <FillBar percentage={bin.fillPercentage} size="sm" />
                                    </div>
                                    <button
                                        className="btn-primary btn btn-sm shrink-0 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => { e.stopPropagation(); handleCreateTask(bin); }}
                                        disabled={taskBinId === bin.id}
                                        title="Create collection task"
                                    >
                                        {taskBinId === bin.id ? <Spinner size={12} /> : <Plus size={12} />}
                                        Task
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent activity */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    {!summary?.recentActivity.length ? (
                        <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
                    ) : (
                        <div className="space-y-3">
                            {summary.recentActivity.map((log) => (
                                <div key={log.id} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <TrendingUp size={12} className="text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800">{log.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
