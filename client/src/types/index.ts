export interface Bin {
    id: string;
    binId: string;
    name: string;
    location: string;
    area: string;
    latitude?: number | null;
    longitude?: number | null;
    fillPercentage: number;
    status: 'Normal' | 'Nearly Full' | 'Full';
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
    alerts?: Alert[];
    tasks?: CollectionTask[];
    logs?: ActivityLog[];
}

export interface Alert {
    id: string;
    binId: string;
    bin?: Bin;
    alertLevel: 'Warning' | 'Critical';
    fillPercentage: number;
    message: string;
    isAcknowledged: boolean;
    isResolved: boolean;
    acknowledgedAt?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CollectionTask {
    id: string;
    taskId: string;
    binId: string;
    bin?: Bin;
    assignedWorker?: string | null;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
    notes?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ActivityLog {
    id: string;
    binId?: string | null;
    bin?: Bin;
    action: string;
    description: string;
    metadata?: string | null;
    createdAt: string;
}

export interface AppSetting {
    id: string;
    appName: string;
    warningThreshold: number;
    criticalThreshold: number;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardSummary {
    totalBins: number;
    normalBins: number;
    nearlyFullBins: number;
    fullBins: number;
    pendingTasks: number;
    assignedTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    activeAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    binsRequiringAttention: Bin[];
    recentActivity: ActivityLog[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
