import { Activity, DatabaseZap, Gauge, Power, TableProperties } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../../shared/ratingConfig.js';
import { api } from '../services/api.js';

export function Admin({ notify }) {
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [ratingConfig, setRatingConfig] = useState([]);
  const [expanded, setExpanded] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [loadedRules, loadedRating] = await Promise.all([api.businessRules(), api.ratingConfig()]);
        if (!cancelled) {
          setRules(loadedRules);
          setRatingConfig(loadedRating);
          setExpanded(loadedRating[0]?.coverageId || '');
        }
      } catch (error) {
        notify({ type: 'error', title: 'Admin load failed', message: error.message });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  async function toggleRule(rule) {
    try {
      const updated = await api.updateBusinessRule(rule.id, !rule.active);
      setRules((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notify({ type: 'success', title: 'Rule updated', message: `${updated.name} is ${updated.active ? 'active' : 'inactive'}.` });
    } catch (error) {
      notify({ type: 'error', title: 'Rule update failed', message: error.message });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 p-5 lg:p-7" data-testid="admin-module">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-600">Admin</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Business Rules + Rating Config</h1>
      </div>

      <div className="flex w-fit rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm" data-testid="admin-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'rules' ? 'tab-button-active' : ''}`}
          onClick={() => setActiveTab('rules')}
          data-testid="admin-rules-tab"
          title="Business rules"
        >
          <TableProperties className="h-4 w-4" />
          Business Rules
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'rating' ? 'tab-button-active' : ''}`}
          onClick={() => setActiveTab('rating')}
          data-testid="admin-rating-tab"
          title="Rating engine"
        >
          <Gauge className="h-4 w-4" />
          Rating Engine
        </button>
      </div>

      {activeTab === 'rules' ? (
        <section className="surface-panel animate-fade-up" data-testid="business-rules-table">
          <div className="panel-title">
            <Activity className="h-5 w-5 text-teal-600" />
            <div>
              <h2>Rule table</h2>
              <p>Rules drive validation on API quote and preview endpoints.</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-slate-200">
            <table className="w-full min-w-[880px] border-collapse bg-white text-left">
              <thead className="bg-slate-950 text-xs uppercase tracking-[0.16em] text-white">
                <tr>
                  <th className="px-4 py-4">Rule Name</th>
                  <th className="px-4 py-4">Condition</th>
                  <th className="px-4 py-4">Error Message</th>
                  <th className="px-4 py-4">Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-slate-200" data-testid={`rule-row-${rule.id}`}>
                    <td className="px-4 py-4 text-sm font-black text-slate-950">{rule.name}</td>
                    <td className="px-4 py-4 text-sm font-semibold leading-6 text-slate-600">{rule.condition}</td>
                    <td className="px-4 py-4 text-sm font-semibold leading-6 text-slate-600">{rule.errorMessage}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule)}
                        className={`toggle ${rule.active ? 'toggle-active' : ''}`}
                        data-testid={`rule-toggle-${rule.id}`}
                        title={`Toggle ${rule.name}`}
                      >
                        <span />
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="surface-panel animate-fade-up" data-testid="rating-engine-tree">
          <div className="panel-title">
            <DatabaseZap className="h-5 w-5 text-indigo-600" />
            <div>
              <h2>Coverage - Limit - Deductible - Modifier - Premium</h2>
              <p>Displayed for operations visibility, outside the policy creation flow.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {ratingConfig.map((item) => {
              const open = expanded === item.coverageId;
              return (
                <article key={item.coverageId} className="coverage-accordion" data-testid={`rating-node-${item.coverageId}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => setExpanded(open ? '' : item.coverageId)}
                    data-testid={`rating-node-button-${item.coverageId}`}
                    title={`Expand ${item.coverageName}`}
                  >
                    <span>
                      <span className="block text-sm font-black text-slate-950">{item.product} Coverage - {item.coverageName}</span>
                      <span className="text-xs font-semibold text-slate-500">Structured rating breakdown</span>
                    </span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      {item.ratingRows.length} rows
                    </span>
                  </button>
                  {open ? (
                    <div className="mt-4 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white" data-testid={`rating-table-${item.coverageId}`}>
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Coverage</th>
                            <th className="px-4 py-3">Limit</th>
                            <th className="px-4 py-3">Deductible</th>
                            <th className="px-4 py-3">Rate Modifier</th>
                            <th className="px-4 py-3">Premium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.ratingRows.slice(0, 12).map((row) => (
                            <tr key={`${item.coverageId}-${row.limit}-${row.deductible}`} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-bold text-slate-800">{item.coverageName}</td>
                              <td className="px-4 py-3 text-slate-600">{formatCurrency(row.limit)}</td>
                              <td className="px-4 py-3 text-slate-600">{formatCurrency(row.deductible)}</td>
                              <td className="px-4 py-3 text-slate-600">{row.rateModifier}</td>
                              <td className="px-4 py-3 font-black text-teal-700">{formatCurrency(row.premium)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
