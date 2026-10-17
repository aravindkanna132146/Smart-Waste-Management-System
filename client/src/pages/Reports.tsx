import React, { useEffect, useState, useCallback } from 'react';
import { Download, BarChart3, RefreshCw } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getDashboardSummary, getCollectionsReport } from '../services/api';
import { DashboardSummary } from '../types';
import { Spinner } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function Reports() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
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

    const downloadCSV = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast(`Exporting ${filename}…`, 'info');
    };

    const pieData = summary ? [
        { name: 'Normal', value: summary.normalBins },
        { name: 'Nearly Full', value: summary.nearlyFullBins },
        { name: 'Full', value: summary.fullBins },
    ].filter((d) => d.value > 0) : [];

    const taskData = summary ? [
        { name: 'Pending', count: summary.pendingTasks, fill: '#94a3b8' },
        { name: 'Assigned', count: summary.assignedTasks, fill: '#60a5fa' },
        { name: 'In Progress', count: summary.inProgressTasks, fill: '#f59e0b' },
        { name: 'Completed', count: summary.completedTasks, fill: '#22c55e' },
    ] : [];

    return (
        <div className="p-6 space-y-6">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-900">Reports</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Data from the live database</p>
                </div>
                <button className="btn-secondary btn btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Spinner size={32} /></div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Bins', value: summary?.totalBins ?? 0, color: 'text-gray-700' },
                            { label: 'Normal Bins', value: summary?.normalBins ?? 0, color: 'text-green-600' },
                            { label: 'Nearly Full', value: summary?.nearlyFullBins ?? 0, color: 'text-amber-600' },
                            { label: 'Full Bins', value: summary?.fullBins ?? 0, color: 'text-red-600' },
                            { label: 'Active Alerts', value: summary?.activeAlerts ?? 0, color: 'text-red-600' },
                            { label: 'Critical Alerts', value: summary?.criticalAlerts ?? 0, color: 'text-red-600' },
                            { label: 'Pending Tasks', value: (summary?.pendingTasks ?? 0) + (summary?.assignedTasks ?? 0) + (summary?.inProgressTasks ?? 0), color: 'text-blue-600' },
                            { label: 'Completed Tasks', value: summary?.completedTasks ?? 0, color: 'text-green-600' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="card text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Bin Status Distribution</h2>
                            {pieData.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-12">No bin data available</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label>
                                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="card">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Task Status Breakdown</h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={taskData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {taskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CSV Exports */}
                    <div className="card">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Export Data (CSV)</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Bin Records', url: '/api/reports/export/bins', file: 'bins_export.csv', desc: 'All registered bins with fill levels and status' },
                                { label: 'Collection Tasks', url: '/api/reports/export/tasks', file: 'tasks_export.csv', desc: 'All collection tasks with assignment and status' },
                                { label: 'Alerts History', url: '/api/reports/export/alerts', file: 'alerts_export.csv', desc: 'All alerts including resolved and acknowledged' },
                            ].map(({ label, url, file, desc }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 size={18} className="text-green-600" />
                                        <span className="font-semibold text-sm">{label}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{desc}</p>
                                    <button
                                        className="btn-primary btn btn-sm w-full"
                                        onClick={() => downloadCSV(url, file)}
                                    >
                                        <Download size={13} /> Download CSV
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
