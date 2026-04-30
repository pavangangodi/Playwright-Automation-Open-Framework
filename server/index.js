import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import {
  buildRatingTree,
  calculatePolicyPremium,
  coverageDefinitions,
  defaultBusinessRules,
  endorsementTypes,
  productTypes,
  usStates,
  validateDraft
} from '../shared/ratingConfig.js';
import {
  connectDatabase,
  createPolicy,
  databaseStatus,
  findPolicyByQuote,
  listRules,
  resetMemoryStore,
  searchPolicies,
  updatePolicyByQuote,
  updateRule
} from './storage.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

function sequence(prefix) {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replaceAll('-', '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${random}`;
}

function sanitizeDraft(draft) {
  return {
    effectiveDate: draft.effectiveDate,
    expiryDate: draft.expiryDate,
    productTypes: draft.productTypes || [],
    producerNumber: draft.producerNumber,
    insuredName: draft.insuredName,
    primaryContact: draft.primaryContact,
    locations: draft.locations || [],
    coverages: draft.coverages || {},
    endorsements: draft.endorsements || { types: [], documents: [] }
  };
}

function generatedForms(policy) {
  const types = policy.endorsements?.types?.length ? policy.endorsements.types : ['Policy Jacket'];
  return types.map((type, index) => ({
    id: `form-${index + 1}`,
    name: `${type} Form`,
    formNumber: `SP-${String(index + 101).padStart(4, '0')}`,
    status: policy.status === 'BOUND' ? 'Ready for Issue' : 'Generated for Review'
  }));
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    app: 'SurePath Policy Console',
    database: databaseStatus()
  });
});

app.get('/api/products', (_request, response) => {
  response.json({ productTypes, usStates, endorsementTypes, coverageDefinitions });
});

app.get('/api/business-rules', async (_request, response) => {
  response.json(await listRules());
});

app.patch('/api/business-rules/:id', async (request, response) => {
  const updated = await updateRule(request.params.id, { active: Boolean(request.body.active) });
  if (!updated) {
    response.status(404).json({ message: 'Rule not found' });
    return;
  }
  response.json(updated);
});

app.get('/api/rating-config', (_request, response) => {
  response.json(buildRatingTree());
});

app.post('/api/rating/preview', async (request, response) => {
  const rules = await listRules();
  const draft = sanitizeDraft(request.body || {});
  const errors = validateDraft(draft, rules);
  response.status(errors.length ? 422 : 200).json({
    valid: errors.length === 0,
    errors,
    premium: calculatePolicyPremium(draft)
  });
});

app.post('/api/policies/quote', async (request, response) => {
  const rules = await listRules();
  const draft = sanitizeDraft(request.body || {});
  const errors = validateDraft(draft, rules);

  if (errors.length) {
    response.status(400).json({ status: 'ERROR', errors });
    return;
  }

  const premium = calculatePolicyPremium(draft);
  const policy = await createPolicy({
    ...draft,
    quoteNumber: sequence('QTE'),
    policyNumber: '',
    status: 'QUOTED',
    premium
  });

  response.status(201).json(policy);
});

app.post('/api/policies/:quoteNumber/bind', async (request, response) => {
  const policy = await findPolicyByQuote(request.params.quoteNumber);
  if (!policy) {
    response.status(404).json({ message: 'Quote not found' });
    return;
  }

  const updated = await updatePolicyByQuote(request.params.quoteNumber, {
    status: 'BOUND',
    policyNumber: policy.policyNumber || sequence('POL')
  });

  response.json(updated);
});

app.get('/api/policies/search', async (request, response) => {
  response.json(await searchPolicies(String(request.query.q || '')));
});

app.get('/api/policies/:quoteNumber/forms', async (request, response) => {
  const policy = await findPolicyByQuote(request.params.quoteNumber);
  if (!policy) {
    response.status(404).json({ message: 'Policy not found' });
    return;
  }

  if (!['QUOTED', 'BOUND'].includes(policy.status)) {
    response.status(403).json({ message: 'Forms are enabled once policy is quoted or bound.' });
    return;
  }

  response.json(generatedForms(policy));
});

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/test/reset', async (_request, response) => {
    await resetMemoryStore();
    response.json({ ok: true, rules: defaultBusinessRules });
  });
}

connectDatabase().then((status) => {
  app.listen(port, () => {
    console.log(`SurePath API listening on http://127.0.0.1:${port} (${status.provider})`);
  });
});
