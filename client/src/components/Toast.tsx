import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const config = {
        success: { icon: CheckCircle, classes: 'bg-green-50 border-green-200 text-green-800' },
        error: { icon: XCircle, classes: 'bg-red-50 border-red-200 text-red-800' },
        warning: { icon: AlertTriangle, classes: 'bg-amber-50 border-amber-200 text-amber-800' },
        info: { icon: Info, classes: 'bg-blue-50 border-blue-200 text-blue-800' },
    };

    const { icon: Icon, classes } = config[type];

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${classes}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm flex-1">{message}</p>
            <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>;
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
            ))}
        </div>
    );
}

// useToast hook
export function useToast() {
    const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

    const addToast = React.useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}
