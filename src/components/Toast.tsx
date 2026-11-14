import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const borderClass =
    toast.type === 'success'
      ? 'border-emerald-500/40'
      : toast.type === 'error'
      ? 'border-rose-500/40'
      : 'border-sky-500/40';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 animate-toast-in max-w-[calc(100vw-2rem)]"
    >
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-ninja-900/95 backdrop-blur-sm border ${borderClass} shadow-2xl text-slate-100 text-xs sm:text-sm font-medium`}>
        {toast.type === 'success' && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        {toast.type === 'error' && (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        )}
        {toast.type === 'info' && (
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
        )}
        <span className="leading-snug">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 text-slate-400 hover:text-white p-0.5 rounded transition-colors shrink-0"
          aria-label="Bildirimi kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
