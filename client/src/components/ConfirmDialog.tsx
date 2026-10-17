import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div
                className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <AlertTriangle size={22} className={type === 'danger' ? 'text-red-600' : 'text-amber-600'} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{message}</p>
                    </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                    <button className="btn-secondary btn" onClick={onCancel}>{cancelText}</button>
                    <button
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-warning'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
