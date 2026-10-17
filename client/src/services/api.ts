import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

export default api;

// ── Bins ──────────────────────────────────────────────────────────────────────
export const getBins = (params?: Record<string, string>) => api.get('/bins', { params });
export const getBin = (id: string) => api.get(`/bins/${id}`);
export const createBin = (data: any) => api.post('/bins', data);
export const updateBin = (id: string, data: any) => api.put(`/bins/${id}`, data);
export const deleteBin = (id: string) => api.delete(`/bins/${id}`);
export const simulateBin = (id: string) => api.post(`/bins/${id}/simulate`);
export const simulateAll = () => api.post('/bins/simulate-all');
export const emptyBin = (id: string) => api.post(`/bins/${id}/empty`);

// ── Alerts ────────────────────────────────────────────────────────────────────
export const getAlerts = (params?: Record<string, string>) => api.get('/alerts', { params });
export const getAllAlerts = () => api.get('/alerts/all');
export const acknowledgeAlert = (id: string) => api.post(`/alerts/${id}/acknowledge`);

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const getTasks = (params?: Record<string, string>) => api.get('/tasks', { params });
export const getTask = (id: string) => api.get(`/tasks/${id}`);
export const createTask = (data: any) => api.post('/tasks', data);
export const updateTask = (id: string, data: any) => api.put(`/tasks/${id}`, data);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getDashboardSummary = () => api.get('/reports/summary');
export const getCollectionsReport = (params?: Record<string, string>) => api.get('/reports/collections', { params });

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => api.get('/settings');
export const updateSettings = (data: any) => api.put('/settings', data);
