import React from 'react';
import { Bin } from '../types';

interface FillBarProps {
    percentage: number;
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export function FillBar({ percentage, showLabel = true, size = 'md' }: FillBarProps) {
    const color =
        percentage >= 90 ? 'bg-red-500' :
            percentage >= 70 ? 'bg-amber-500' : 'bg-green-500';

    const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

    return (
        <div className="flex items-center gap-2 w-full">
            <div className={`flex-1 ${height} rounded-full bg-gray-100 overflow-hidden`}>
                <div
                    className={`${height} rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
            </div>
            {showLabel && (
                <span className={`text-xs font-semibold w-9 text-right ${percentage >= 90 ? 'text-red-600' : percentage >= 70 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                    {percentage}%
                </span>
            )}
        </div>
    );
}

interface StatusBadgeProps {
    status: Bin['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = {
        'Normal': 'badge-green',
        'Nearly Full': 'badge-yellow',
        'Full': 'badge-red',
    };
    return <span className={config[status]}>{status}</span>;
}

interface PriorityBadgeProps {
    priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    const config: Record<string, string> = {
        Low: 'badge-gray',
        Medium: 'badge-blue',
        High: 'badge-yellow',
        Urgent: 'badge-red',
    };
    return <span className={config[priority] || 'badge-gray'}>{priority}</span>;
}

interface TaskStatusBadgeProps {
    status: string;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
    const config: Record<string, string> = {
        Pending: 'badge-gray',
        Assigned: 'badge-blue',
        'In Progress': 'badge-yellow',
        Completed: 'badge-green',
    };
    return <span className={config[status] || 'badge-gray'}>{status}</span>;
}

export function Spinner({ size = 24 }: { size?: number }) {
    return (
        <div
            style={{ width: size, height: size, borderWidth: 3 }}
            className="rounded-full border-gray-200 border-t-green-600 animate-spin"
        />
    );
}

export function EmptyState({ icon, title, description, action }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-gray-300 mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-xs">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
        </div>
    );
}

export function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function timeAgo(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
