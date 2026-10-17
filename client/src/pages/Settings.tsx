import React, { useEffect, useState, useCallback } from 'react';
import { Save, Settings as SettingsIcon, Activity, Info } from 'lucide-react';
import { getSettings, updateSettings, simulateAll } from '../services/api';
import { AppSetting } from '../types';
import { Spinner } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';

export default function Settings() {
    const [settings, setSettings] = useState<AppSetting | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [form, setForm] = useState({
        appName: '',
        warningThreshold: 70,
        criticalThreshold: 90,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { toasts, addToast, removeToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSettings();
            const s = res.data.data;
            setSettings(s);
            setForm({
                appName: s.appName,
                warningThreshold: s.warningThreshold,
                criticalThreshold: s.criticalThreshold,
            });
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.appName.trim()) e.appName = 'App name is required';
        if (form.warningThreshold >= form.criticalThreshold) {
            e.warningThreshold = 'Warning threshold must be lower than critical threshold';
        }
        if (form.warningThreshold < 1 || form.warningThreshold > 99) {
            e.warningThreshold = 'Warning threshold must be between 1 and 99';
        }
        if (form.criticalThreshold < 2 || form.criticalThreshold > 100) {
            e.criticalThreshold = 'Critical threshold must be between 2 and 100';
        }
        return e;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        try {
            await updateSettings(form);
            addToast('Settings saved successfully', 'success');
            load();
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSimulateAll = async () => {
        setSimulating(true);
        try {
            const res = await simulateAll();
            addToast(res.data.message, 'success');
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setSimulating(false);
        }
    };

    if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>;

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div>
                <h1 className="text-2xl font-bold text-green-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Configure application behaviour</p>
            </div>

            {/* General settings */}
            <div className="card space-y-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <SettingsIcon size={18} className="text-green-600" /> General Settings
                </h2>

                <div>
                    <label className="form-label" htmlFor="appName">Application Name</label>
                    <input
                        id="appName"
                        type="text"
                        className="form-input"
                        value={form.appName}
                        onChange={(e) => { setForm({ ...form, appName: e.target.value }); setErrors({}); }}
                    />
                    {errors.appName && <p className="text-xs text-red-500 mt-1">{errors.appName}</p>}
                </div>

                <div>
                    <label className="form-label" htmlFor="warningThreshold">
                        Warning Threshold (%) — bins above this are "Nearly Full"
                    </label>
                    <input
                        id="warningThreshold"
                        type="number"
                        min={1}
                        max={99}
                        className="form-input"
                        value={form.warningThreshold}
                        onChange={(e) => { setForm({ ...form, warningThreshold: Number(e.target.value) }); setErrors({}); }}
                    />
                    {errors.warningThreshold && <p className="text-xs text-red-500 mt-1">{errors.warningThreshold}</p>}
                </div>

                <div>
                    <label className="form-label" htmlFor="criticalThreshold">
                        Critical Threshold (%) — bins above this are "Full"
                    </label>
                    <input
                        id="criticalThreshold"
                        type="number"
                        min={2}
                        max={100}
                        className="form-input"
                        value={form.criticalThreshold}
                        onChange={(e) => { setForm({ ...form, criticalThreshold: Number(e.target.value) }); setErrors({}); }}
                    />
                    {errors.criticalThreshold && <p className="text-xs text-red-500 mt-1">{errors.criticalThreshold}</p>}
                </div>

                {/* Visual preview */}
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
                    <p className="font-medium mb-1">Current Threshold Rules:</p>
                    <ul className="space-y-0.5 text-xs">
                        <li>🟢 <strong>Normal:</strong> 0% to {form.warningThreshold - 1}%</li>
                        <li>🟡 <strong>Nearly Full:</strong> {form.warningThreshold}% to {form.criticalThreshold - 1}%</li>
                        <li>🔴 <strong>Full:</strong> {form.criticalThreshold}% to 100%</li>
                    </ul>
                </div>

                <button className="btn-primary btn" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner size={16} /> : <Save size={16} />}
                    Save Settings
                </button>
            </div>

            {/* Simulation controls */}
            <div className="card space-y-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" /> Sensor Simulation
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    <strong>Simulation Mode</strong> — This application uses <em>simulated sensor readings</em>.
                    No physical IoT sensors or hardware are connected. Click below to update all bin readings.
                </div>
                <button className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700" onClick={handleSimulateAll} disabled={simulating}>
                    {simulating ? <Spinner size={14} /> : <Activity size={14} />}
                    Simulate All Bin Sensors Now
                </button>
            </div>

            {/* App info */}
            <div className="card space-y-3">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Info size={18} className="text-gray-500" /> Application Information
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Project:</strong> Smart Waste Management System</p>
                    <p><strong>Purpose:</strong> Monitor bins, manage collections, improve city cleanliness</p>
                    <p><strong>SDG Goal:</strong> UN Sustainable Development Goal 11 — Sustainable Cities and Communities</p>
                    <p><strong>Stack:</strong> React + TypeScript + Tailwind (frontend), Node.js + Express + Prisma + SQLite (backend)</p>
                    <p><strong>Version:</strong> 1.0.0</p>
                </div>
            </div>
        </div>
    );
}
