import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  ChevronDown,
  FileSignature,
  FileUp,
  Layers3,
  MapPinned,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  calculatePolicyPremium,
  coverageDefinitions,
  createInitialDraft,
  deductibleOptions,
  endorsementTypes,
  formatCurrency,
  limitOptions,
  productTypes,
  usStates
} from '../../shared/ratingConfig.js';
import { Field, MultiSelect, SearchSelect, TextInput } from '../components/Inputs.jsx';
import { wizardSteps } from '../components/Sidebar.jsx';
import { api } from '../services/api.js';

const today = new Date().toISOString().slice(0, 10);
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function seededDraft() {
  return {
    ...createInitialDraft(),
    effectiveDate: today,
    expiryDate: nextYear
  };
}

function coverageListFor(products) {
  return products.flatMap((product) => (coverageDefinitions[product] || []).map((coverage) => ({ ...coverage, product })));
}

function cleanCoveragesForProducts(coverages, products) {
  const allowed = new Set(coverageListFor(products).map((coverage) => coverage.id));
  return Object.fromEntries(Object.entries(coverages).filter(([coverageId]) => allowed.has(coverageId)));
}

function validatePolicyInfo(draft) {
  const errors = {};
  if (!draft.effectiveDate) errors.effectiveDate = 'Required';
  if (!draft.expiryDate) errors.expiryDate = 'Required';
  if (draft.effectiveDate && draft.expiryDate && new Date(draft.expiryDate) <= new Date(draft.effectiveDate)) {
    errors.expiryDate = 'Expiry must be after effective date';
  }
  if (!draft.productTypes.length) errors.productTypes = 'Select at least one product';
  if (!draft.producerNumber.trim()) errors.producerNumber = 'Required';
  if (!draft.insuredName.trim()) errors.insuredName = 'Required';
  if (!draft.primaryContact.trim()) errors.primaryContact = 'Required';
  return errors;
}

function StepHeader({ activeStep }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-600">Create Policy</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950" data-testid="create-policy-heading">
          {wizardSteps[activeStep]}
        </h1>
      </div>
      <div className="flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
        {wizardSteps.map((step, index) => (
          <span
            key={step}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              index === activeStep ? 'bg-slate-950 text-white shadow-soft' : 'text-slate-500'
            }`}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function PolicyInfoStep({ draft, setDraft, errors }) {
  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateProducts(next) {
    setDraft((current) => ({
      ...current,
      productTypes: next,
      coverages: cleanCoveragesForProducts(current.coverages, next),
      locations: current.locations.filter((location) => next.includes(location.product))
    }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="surface-panel animate-fade-up" data-testid="policy-info-card">
        <div className="panel-title">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          <div>
            <h2>Policy foundation</h2>
            <p>Core contract data used by the quote, bind, and search flows.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Effective Date" error={errors.effectiveDate} testId="field-effective-date">
            <TextInput
              type="date"
              value={draft.effectiveDate}
              onChange={(event) => update('effectiveDate', event.target.value)}
              data-testid="effective-date-input"
            />
          </Field>
          <Field label="Expiry Date" error={errors.expiryDate} testId="field-expiry-date">
            <TextInput
              type="date"
              value={draft.expiryDate}
              onChange={(event) => update('expiryDate', event.target.value)}
              data-testid="expiry-date-input"
            />
          </Field>
          <MultiSelect
            label="Product Type"
            options={productTypes}
            selected={draft.productTypes}
            onChange={updateProducts}
            placeholder="Search and select products"
            testId="product-type"
          />
          <Field label="Producer Number" error={errors.producerNumber} testId="field-producer-number">
            <TextInput
              value={draft.producerNumber}
              onChange={(event) => update('producerNumber', event.target.value)}
              placeholder="PRD-20491"
              data-testid="producer-number-input"
            />
          </Field>
          <Field label="Insured Name" error={errors.insuredName} testId="field-insured-name">
            <TextInput
              value={draft.insuredName}
              onChange={(event) => update('insuredName', event.target.value)}
              placeholder="Acme Manufacturing LLC"
              data-testid="insured-name-input"
            />
          </Field>
          <Field label="Primary Contact" error={errors.primaryContact} testId="field-primary-contact">
            <TextInput
              value={draft.primaryContact}
              onChange={(event) => update('primaryContact', event.target.value)}
              placeholder="Nina Shah · nina@example.com"
              data-testid="primary-contact-input"
            />
          </Field>
        </div>
      </section>

      <section className="surface-panel animate-fade-up [animation-delay:80ms]" data-testid="policy-intelligence-card">
        <div className="panel-title">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <h2>Underwriting signal</h2>
            <p>Live readiness hints update as required data appears.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {[
            ['Date logic', draft.effectiveDate && draft.expiryDate && !errors.expiryDate],
            ['Product selected', draft.productTypes.length > 0],
            ['Producer attached', draft.producerNumber.trim().length > 0],
            ['Insured profile', draft.insuredName.trim().length > 0],
            ['Manual contact', draft.primaryContact.trim().length > 0]
          ].map(([label, complete]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">{label}</span>
              <CheckCircle2 className={`h-5 w-5 ${complete ? 'text-emerald-500' : 'text-slate-300'}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LocationStep({ draft, setDraft }) {
  const [product, setProduct] = useState('');
  const [state, setState] = useState('');

  function addLocation() {
    if (!product || !state) return;
    setDraft((current) => {
      const duplicate = current.locations.some((location) => location.product === product && location.state === state);
      return {
        ...current,
        locations: duplicate ? current.locations : [...current.locations, { product, state }]
      };
    });
    setState('');
  }

  function removeLocation(target) {
    setDraft((current) => ({
      ...current,
      locations: current.locations.filter((location) => !(location.product === target.product && location.state === target.state))
    }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="surface-panel animate-fade-up" data-testid="location-selection-card">
        <div className="panel-title">
          <MapPinned className="h-5 w-5 text-teal-600" />
          <div>
            <h2>Location assignment</h2>
            <p>Select a state location per product for underwriting context.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <Field label="Product">
            <select
              className="input-control"
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              data-testid="location-product-select"
            >
              <option value="">Choose product</option>
              {draft.productTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <SearchSelect
            label="US State"
            options={usStates}
            value={state}
            onChange={setState}
            placeholder="Search state"
            testId="state-select"
          />
          <button
            type="button"
            className="primary-button"
            onClick={addLocation}
            data-testid="add-location-button"
            title="Add selected location"
          >
            Add Location
          </button>
        </div>
      </section>

      <section className="surface-panel animate-fade-up [animation-delay:80ms]" data-testid="selected-locations-card">
        <div className="panel-title">
          <Layers3 className="h-5 w-5 text-indigo-600" />
          <div>
            <h2>Selected locations</h2>
            <p>Location tags are stored with the quoted policy record.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {draft.locations.length ? (
            draft.locations.map((location) => (
              <div
                key={`${location.product}-${location.state}`}
                className="location-card"
                data-testid={`location-card-${location.product}-${location.state}`}
              >
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{location.product}</span>
                <strong className="mt-2 text-2xl text-slate-950">{location.state}</strong>
                <button
                  type="button"
                  className="mt-4 text-left text-xs font-bold text-rose-600"
                  onClick={() => removeLocation(location)}
                  title={`Remove ${location.product} ${location.state}`}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state md:col-span-2" data-testid="locations-empty-state">
              Pick products in Policy Info, then assign at least one state location here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CoverageStep({ draft, setDraft, premium }) {
  const coverages = coverageListFor(draft.productTypes);
  const [expanded, setExpanded] = useState(coverages[0]?.id || '');

  function updateCoverage(coverageId, patch) {
    setDraft((current) => ({
      ...current,
      coverages: {
        ...current.coverages,
        [coverageId]: {
          selected: true,
          limit: limitOptions[1],
          deductible: deductibleOptions[2],
          ...current.coverages[coverageId],
          ...patch
        }
      }
    }));
  }

  function toggleCoverage(coverageId, checked) {
    setDraft((current) => ({
      ...current,
      coverages: {
        ...current.coverages,
        [coverageId]: {
          selected: checked,
          limit: current.coverages[coverageId]?.limit || limitOptions[1],
          deductible: current.coverages[coverageId]?.deductible || deductibleOptions[2]
        }
      }
    }));
    setExpanded(coverageId);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="surface-panel animate-fade-up" data-testid="coverage-details-card">
        <div className="panel-title">
          <FileSignature className="h-5 w-5 text-teal-600" />
          <div>
            <h2>Product coverages</h2>
            <p>Coverage choices appear only for selected products.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {coverages.length ? (
            coverages.map((coverage) => {
              const value = draft.coverages[coverage.id] || {};
              const selected = Boolean(value.selected);
              const open = expanded === coverage.id;
              return (
                <article
                  key={coverage.id}
                  className={`coverage-accordion ${selected ? 'coverage-accordion-selected' : ''}`}
                  data-testid={`coverage-card-${coverage.id}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => toggleCoverage(coverage.id, event.target.checked)}
                      className="h-5 w-5 accent-teal-600"
                      data-testid={`coverage-toggle-${coverage.id}`}
                    />
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-between gap-4 text-left"
                      onClick={() => setExpanded(open ? '' : coverage.id)}
                      data-testid={`coverage-accordion-${coverage.id}`}
                      title={`Configure ${coverage.name}`}
                    >
                      <span>
                        <span className="block text-sm font-black text-slate-950">{coverage.name}</span>
                        <span className="text-xs font-semibold text-slate-500">{coverage.product}</span>
                      </span>
                      <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {open ? (
                    <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2" data-testid={`coverage-panel-${coverage.id}`}>
                      <Field label="Limit">
                        <select
                          className="input-control"
                          value={value.limit || limitOptions[1]}
                          onChange={(event) => updateCoverage(coverage.id, { limit: Number(event.target.value) })}
                          disabled={!selected}
                          data-testid={`coverage-limit-${coverage.id}`}
                        >
                          {limitOptions.map((limit) => (
                            <option key={limit} value={limit}>
                              {formatCurrency(limit)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Deductible">
                        <select
                          className="input-control"
                          value={value.deductible || deductibleOptions[2]}
                          onChange={(event) => updateCoverage(coverage.id, { deductible: Number(event.target.value) })}
                          disabled={!selected}
                          data-testid={`coverage-deductible-${coverage.id}`}
                        >
                          {deductibleOptions.map((deductible) => (
                            <option key={deductible} value={deductible}>
                              {formatCurrency(deductible)}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="empty-state" data-testid="coverage-empty-state">
              Select at least one product in Policy Info to reveal eligible coverages.
            </div>
          )}
        </div>
      </section>

      <aside className="surface-panel animate-fade-up [animation-delay:80ms]" data-testid="premium-preview-card">
        <div className="panel-title">
          <BadgeIndianRupee className="h-5 w-5 text-amber-500" />
          <div>
            <h2>Premium preview</h2>
            <p>Limit × deductible × rate modifier.</p>
          </div>
        </div>
        <div className="mt-6 rounded-[1.2rem] border border-slate-200 bg-slate-950 p-5 text-white">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Estimated premium</span>
          <strong className="mt-2 block text-4xl font-black" data-testid="premium-total">
            {formatCurrency(premium.totalPremium)}
          </strong>
          <p className="mt-2 text-sm text-slate-300">Includes product and endorsement modifiers.</p>
        </div>
        <div className="mt-5 grid gap-3">
          {premium.breakdown.length ? (
            premium.breakdown.map((item) => (
              <div key={item.coverageId} className="flex justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{item.coverageName}</p>
                  <p className="text-xs font-medium text-slate-500">Modifier {item.rateModifier}</p>
                </div>
                <strong className="text-sm text-slate-950">{formatCurrency(item.premium)}</strong>
              </div>
            ))
          ) : (
            <div className="empty-state">Select coverage to preview premium.</div>
          )}
        </div>
      </aside>
    </div>
  );
}

function EndorsementStep({ draft, setDraft, premium, quotedPolicy, boundPolicy, forms, onQuote, onBind, isBusy }) {
  function toggleType(type) {
    setDraft((current) => {
      const selected = current.endorsements.types.includes(type);
      return {
        ...current,
        endorsements: {
          ...current.endorsements,
          types: selected
            ? current.endorsements.types.filter((item) => item !== type)
            : [...current.endorsements.types, type]
        }
      };
    });
  }

  function handleUpload(event) {
    const files = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      uploadedAt: new Date().toISOString()
    }));
    setDraft((current) => ({
      ...current,
      endorsements: {
        ...current.endorsements,
        documents: [...current.endorsements.documents, ...files]
      }
    }));
  }

  const policy = boundPolicy || quotedPolicy;
  const formsEnabled = Boolean(policy?.quoteNumber);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <section className="surface-panel animate-fade-up" data-testid="endorsements-card">
        <div className="panel-title">
          <FileUp className="h-5 w-5 text-teal-600" />
          <div>
            <h2>Endorsements</h2>
            <p>Attach dummy documents and choose endorsement forms.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {endorsementTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`choice-card ${draft.endorsements.types.includes(type) ? 'choice-card-active' : ''}`}
              onClick={() => toggleType(type)}
              data-testid={`endorsement-type-${type}`}
              title={`Toggle ${type}`}
            >
              <span className="text-sm font-black text-slate-950">{type}</span>
              <span className="text-xs font-semibold text-slate-500">Generated after quote</span>
            </button>
          ))}
        </div>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[1.3rem] border border-dashed border-teal-300 bg-teal-50/70 px-5 py-7 text-center transition hover:bg-teal-50">
          <FileUp className="h-6 w-6 text-teal-700" />
          <span className="mt-2 text-sm font-black text-slate-950">Upload dummy documents</span>
          <span className="mt-1 text-xs font-medium text-slate-500">Any test file name is stored with the draft payload.</span>
          <input type="file" multiple className="sr-only" onChange={handleUpload} data-testid="endorsement-upload-input" />
        </label>

        {draft.endorsements.documents.length ? (
          <div className="mt-4 grid gap-2" data-testid="uploaded-document-list">
            {draft.endorsements.documents.map((document) => (
              <div key={`${document.name}-${document.uploadedAt}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {document.name}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <aside className="surface-panel animate-fade-up [animation-delay:80ms]" data-testid="quote-bind-card">
        <div className="panel-title">
          <BadgeIndianRupee className="h-5 w-5 text-amber-500" />
          <div>
            <h2>Quote and bind</h2>
            <p>Actions unlock only on final wizard step.</p>
          </div>
        </div>
        <div className="mt-6 rounded-[1.2rem] border border-slate-200 bg-slate-950 p-5 text-white">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Final premium</span>
          <strong className="mt-2 block text-4xl font-black" data-testid="final-premium">
            {formatCurrency(premium.totalPremium)}
          </strong>
        </div>
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            className="primary-button"
            onClick={onQuote}
            disabled={isBusy}
            data-testid="quote-policy-button"
            title="Generate quote number"
          >
            Quote Policy
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onBind}
            disabled={!quotedPolicy || Boolean(boundPolicy) || isBusy}
            data-testid="bind-policy-button"
            title="Generate policy number"
          >
            Bind Policy
          </button>
        </div>

        {policy ? (
          <div className="mt-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4" data-testid="quote-result-card">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{policy.status}</p>
            <p className="mt-2 text-sm font-black text-slate-950" data-testid="quote-number-value">
              {policy.quoteNumber}
            </p>
            {policy.policyNumber ? (
              <p className="mt-1 text-sm font-black text-slate-950" data-testid="policy-number-value">
                {policy.policyNumber}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 rounded-[1.2rem] border border-slate-200 bg-white p-4" data-testid="forms-screen">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-slate-950">Forms screen</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${formsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {formsEnabled ? 'Enabled' : 'Locked'}
            </span>
          </div>
          {formsEnabled ? (
            <div className="mt-3 grid gap-2" data-testid="generated-forms-list">
              {forms.map((form) => (
                <div key={form.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-black text-slate-950">{form.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{form.formNumber} · {form.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-500" data-testid="forms-locked-message">
              Generated forms are enabled once the policy is Quoted or Bound.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export function CreatePolicy({ activeStep, setActiveStep, notify }) {
  const [draft, setDraft] = useState(seededDraft);
  const [errors, setErrors] = useState({});
  const [quotedPolicy, setQuotedPolicy] = useState(null);
  const [boundPolicy, setBoundPolicy] = useState(null);
  const [forms, setForms] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const premium = useMemo(() => calculatePolicyPremium(draft), [draft]);

  async function loadForms(policy) {
    const generatedForms = await api.forms(policy.quoteNumber);
    setForms(generatedForms);
  }

  async function quotePolicy() {
    setIsBusy(true);
    try {
      const policy = await api.quotePolicy(draft);
      setQuotedPolicy(policy);
      setBoundPolicy(null);
      await loadForms(policy);
      notify({ type: 'success', title: 'Quote generated', message: policy.quoteNumber });
    } catch (error) {
      const firstError = error.payload?.errors?.[0]?.message || error.message;
      notify({ type: 'error', title: 'Quote blocked', message: firstError });
    } finally {
      setIsBusy(false);
    }
  }

  async function bindPolicy() {
    if (!quotedPolicy) return;
    setIsBusy(true);
    try {
      const policy = await api.bindPolicy(quotedPolicy.quoteNumber);
      setBoundPolicy(policy);
      await loadForms(policy);
      notify({ type: 'success', title: 'Policy bound', message: policy.policyNumber });
    } catch (error) {
      notify({ type: 'error', title: 'Bind failed', message: error.message });
    } finally {
      setIsBusy(false);
    }
  }

  function goNext() {
    if (activeStep === 0) {
      const nextErrors = validatePolicyInfo(draft);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        notify({ type: 'error', title: 'Policy info needs attention', message: 'Complete the required fields before continuing.' });
        return;
      }
    }
    setActiveStep(Math.min(activeStep + 1, wizardSteps.length - 1));
  }

  function goBack() {
    setActiveStep(Math.max(activeStep - 1, 0));
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 p-5 lg:p-7" data-testid="create-policy-module">
      <StepHeader activeStep={activeStep} />

      <div className="transition-all duration-300">
        {activeStep === 0 ? <PolicyInfoStep draft={draft} setDraft={setDraft} errors={errors} /> : null}
        {activeStep === 1 ? <LocationStep draft={draft} setDraft={setDraft} /> : null}
        {activeStep === 2 ? <CoverageStep draft={draft} setDraft={setDraft} premium={premium} /> : null}
        {activeStep === 3 ? (
          <EndorsementStep
            draft={draft}
            setDraft={setDraft}
            premium={premium}
            quotedPolicy={quotedPolicy}
            boundPolicy={boundPolicy}
            forms={forms}
            onQuote={quotePolicy}
            onBind={bindPolicy}
            isBusy={isBusy}
          />
        ) : null}
      </div>

      <footer className="flex items-center justify-between rounded-[1.4rem] border border-white/70 bg-white/80 px-4 py-3 shadow-soft backdrop-blur-xl">
        <button
          type="button"
          className="icon-text-button"
          onClick={goBack}
          disabled={activeStep === 0}
          data-testid="wizard-back-button"
          title="Previous step"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 md:flex">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Quote and bind are available on Endorsements.
        </div>
        <button
          type="button"
          className="icon-text-button bg-slate-950 text-white disabled:bg-slate-200 disabled:text-slate-500"
          onClick={goNext}
          disabled={activeStep === wizardSteps.length - 1}
          data-testid="wizard-next-button"
          title="Next step"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}
