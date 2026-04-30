import {
  ClipboardPlus,
  FileSearch,
  Gauge,
  Landmark,
  ShieldCheck,
  Sparkles,
  Workflow
} from 'lucide-react';

const navItems = [
  { id: 'create', label: 'Create Policy', icon: ClipboardPlus },
  { id: 'search', label: 'Search Policy', icon: FileSearch },
  { id: 'admin', label: 'Admin', icon: Gauge }
];

export const wizardSteps = ['Policy Info', 'Location Details', 'Coverage Details', 'Endorsements'];

export function Sidebar({ activeModule, setActiveModule, activeStep, setActiveStep }) {
  return (
    <aside className="flex min-h-screen w-80 shrink-0 flex-col border-r border-white/70 bg-white/70 px-5 py-5 shadow-[18px_0_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-glow">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold tracking-wide text-slate-950">SurePath</p>
          <p className="text-xs font-medium text-slate-500">Policy Console</p>
        </div>
      </div>

      <div className="mt-7 grid gap-2" data-testid="primary-navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveModule(item.id)}
              className={`nav-button group ${active ? 'nav-button-active' : ''}`}
              data-testid={`nav-${item.id}`}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {active ? <Sparkles className="ml-auto h-4 w-4 text-amber-400" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-7 rounded-[1.4rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Wizard flow</span>
          <Workflow className="h-4 w-4 text-teal-200" />
        </div>
        <div className="mt-5 grid gap-3" data-testid="wizard-stepper">
          {wizardSteps.map((step, index) => {
            const isActive = activeModule === 'create' && activeStep === index;
            const isComplete = activeModule === 'create' && activeStep > index;
            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setActiveModule('create');
                  setActiveStep(index);
                }}
                className={`stepper-row ${isActive ? 'stepper-row-active' : ''}`}
                data-testid={`sidebar-step-${step.toLowerCase().replaceAll(' ', '-')}`}
                title={`Go to ${step}`}
              >
                <span className={`stepper-dot ${isActive ? 'stepper-dot-active' : ''} ${isComplete ? 'stepper-dot-complete' : ''}`}>
                  {isComplete ? <ShieldCheck className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="text-left text-sm font-semibold">{step}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-teal-100 bg-teal-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">QA-ready</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">Every command surface includes stable selectors for Playwright flows and API assertions.</p>
      </div>
    </aside>
  );
}
