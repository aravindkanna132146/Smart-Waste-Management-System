import React, { useEffect, useState, useCallback } from 'react';
import { Bell, RefreshCw, CheckCheck, AlertTriangle } from 'lucide-react';
import { getAlerts, acknowledgeAlert } from '../services/api';
import { Alert } from '../types';
import { Spinner, EmptyState, formatDateTime } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';

type LevelFilter = 'all' | 'Warning' | 'Critical';
type AckFilter = 'all' | 'unacknowledged' | 'acknowledged';

export default function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
    const [ackFilter, setAckFilter] = useState<AckFilter>('all');
    const [ackLoading, setAckLoading] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (levelFilter !== 'all') params.level = levelFilter;
            if (ackFilter === 'unacknowledged') params.acknowledged = 'false';
            if (ackFilter === 'acknowledged') params.acknowledged = 'true';
            const res = await getAlerts(params);
            setAlerts(res.data.data);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [levelFilter, ackFilter]);

    useEffect(() => { load(); }, [load]);

    const handleAcknowledge = async (alert: Alert) => {
        setAckLoading(alert.id);
        try {
            await acknowledgeAlert(alert.id);
            addToast('Alert acknowledged', 'success');
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setAckLoading(null);
        }
    };

    const criticalCount = alerts.filter((a) => a.alertLevel === 'Critical').length;
    const warningCount = alerts.filter((a) => a.alertLevel === 'Warning').length;
    const unackCount = alerts.filter((a) => !a.isAcknowledged).length;

    return (
        <div className="p-6 space-y-5">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-900">Alerts</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{alerts.length} active alerts</p>
                </div>
                <button className="btn-secondary btn btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-3">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    <span className="text-sm font-semibold text-red-700">{criticalCount} Critical</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{warningCount} Warning</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Bell size={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{unackCount} Unacknowledged</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex gap-1">
                    {(['all', 'Warning', 'Critical'] as LevelFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setLevelFilter(f)}
                            className={`btn btn-sm ${levelFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {f === 'all' ? 'All Levels' : f}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    {([
                        { value: 'all', label: 'All' },
                        { value: 'unacknowledged', label: 'Unacknowledged' },
                        { value: 'acknowledged', label: 'Acknowledged' },
                    ] as { value: AckFilter; label: string }[]).map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setAckFilter(f.value)}
                            className={`btn btn-sm ${ackFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alert list */}
            {loading ? (
                <div className="flex justify-center py-16"><Spinner size={32} /></div>
            ) : alerts.length === 0 ? (
                <EmptyState
                    icon={<Bell size={48} />}
                    title="No alerts found"
                    description="All bins are within acceptable fill levels"
                />
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`card border-l-4 ${alert.alertLevel === 'Critical' ? 'border-l-red-500' : 'border-l-amber-500'
                                } ${alert.isAcknowledged ? 'opacity-70' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full mt-0.5 ${alert.alertLevel === 'Critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                        <AlertTriangle size={16} className={alert.alertLevel === 'Critical' ? 'text-red-600' : 'text-amber-600'} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`badge ${alert.alertLevel === 'Critical' ? 'badge-red' : 'badge-yellow'}`}>
                                                {alert.alertLevel}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">{alert.bin?.binId || alert.binId}</span>
                                            {alert.isAcknowledged && <span className="badge badge-green">Acknowledged</span>}
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                                            <span>📍 {alert.bin?.location || '–'}</span>
                                            <span>🗑 {alert.fillPercentage}% full</span>
                                            <span>🕐 {formatDateTime(alert.createdAt)}</span>
                                            {alert.acknowledgedAt && <span>✓ Ack: {formatDateTime(alert.acknowledgedAt)}</span>}
                                        </div>
                                    </div>
                                </div>
                                {!alert.isAcknowledged && (
                                    <button
                                        className="btn-secondary btn btn-sm shrink-0"
                                        onClick={() => handleAcknowledge(alert)}
                                        disabled={ackLoading === alert.id}
                                    >
                                        {ackLoading === alert.id ? <Spinner size={14} /> : <CheckCheck size={14} />}
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
