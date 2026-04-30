import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { ToastRegion } from './components/Toast.jsx';
import { Admin } from './modules/Admin.jsx';
import { CreatePolicy } from './modules/CreatePolicy.jsx';
import { SearchPolicy } from './modules/SearchPolicy.jsx';
import { api } from './services/api.js';

export default function App() {
  const [activeModule, setActiveModule] = useState('create');
  const [activeStep, setActiveStep] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState(null);

  const notify = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.health()
      .then((payload) => {
        if (!cancelled) setHealth(payload);
      })
      .catch(() => {
        if (!cancelled) setHealth({ database: { provider: 'offline' } });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-app text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(20,184,166,0.16),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(245,158,11,0.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,249,0.78))]" />
      <ToastRegion toasts={toasts} />
      <div className="relative flex min-h-screen">
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/70 bg-white/60 px-5 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
              <span className="text-sm font-black text-slate-950" data-testid="app-status">
                {health?.database?.provider === 'mongodb' ? 'MongoDB connected' : 'Memory demo store'}
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 md:flex">
              <span>REST API</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Playwright selectors</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Quote/Bind</span>
            </div>
          </header>

          {activeModule === 'create' ? (
            <CreatePolicy activeStep={activeStep} setActiveStep={setActiveStep} notify={notify} />
          ) : null}
          {activeModule === 'search' ? <SearchPolicy notify={notify} /> : null}
          {activeModule === 'admin' ? <Admin notify={notify} /> : null}
        </main>
      </div>
    </div>
  );
}
