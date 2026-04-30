import { FileSearch, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../shared/ratingConfig.js';
import { api } from '../services/api.js';

export function SearchPolicy({ notify }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  async function runSearch(event) {
    event?.preventDefault();
    if (!query.trim()) {
      notify({ type: 'error', title: 'Search query required', message: 'Enter a quote number, policy number, or insured name.' });
      return;
    }

    setIsSearching(true);
    try {
      const policies = await api.searchPolicies(query);
      setResults(policies);
      notify({ type: 'success', title: 'Search complete', message: `${policies.length} policy record(s) found.` });
    } catch (error) {
      notify({ type: 'error', title: 'Search failed', message: error.message });
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 p-5 lg:p-7" data-testid="search-policy-module">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-600">Search Policy</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Find quoted or bound policies</h1>
      </div>

      <section className="surface-panel animate-fade-up">
        <div className="panel-title">
          <FileSearch className="h-5 w-5 text-teal-600" />
          <div>
            <h2>Policy lookup</h2>
            <p>Search by quote number, policy number, or insured name.</p>
          </div>
        </div>

        <form onSubmit={runSearch} className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className="input-control h-12 pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="QTE-20260429-1234, POL-20260429-1234, or Acme"
              data-testid="policy-search-input"
            />
          </div>
          <button className="primary-button md:w-44" disabled={isSearching} data-testid="policy-search-button" title="Search policy">
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-4" data-testid="search-results">
        {results.length ? (
          results.map((policy) => (
            <article key={policy._id || policy.quoteNumber} className="policy-result-card" data-testid="policy-search-result">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{policy.status}</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">{policy.insuredName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{policy.productTypes?.join(', ')}</p>
              </div>
              <div className="grid gap-2 text-sm font-bold text-slate-700 md:text-right">
                <span data-testid="result-quote-number">Quote: {policy.quoteNumber}</span>
                <span data-testid="result-policy-number">Policy: {policy.policyNumber || 'Not bound'}</span>
                <span className="text-teal-700" data-testid="result-premium">
                  {formatCurrency(policy.premium?.totalPremium || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                {policy.status}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state" data-testid="search-empty-state">
            Search results will appear here after quote or bind.
          </div>
        )}
      </section>
    </div>
  );
}
