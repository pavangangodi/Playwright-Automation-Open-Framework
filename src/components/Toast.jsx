import { CheckCircle2, XCircle } from 'lucide-react';

export function ToastRegion({ toasts }) {
  return (
    <div className="fixed right-5 top-5 z-50 grid gap-3" data-testid="toast-region">
      {toasts.map((toast) => {
        const Icon = toast.type === 'error' ? XCircle : CheckCircle2;
        return (
          <div
            key={toast.id}
            className={`glass-panel flex min-w-80 items-start gap-3 border px-4 py-3 shadow-soft ${
              toast.type === 'error' ? 'border-rose-200 bg-rose-50/90' : 'border-emerald-200 bg-white/90'
            }`}
            data-testid={`toast-${toast.type}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 ${toast.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`} />
            <div>
              <p className="text-sm font-semibold text-slate-950">{toast.title}</p>
              {toast.message ? <p className="mt-0.5 text-xs leading-5 text-slate-600">{toast.message}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
