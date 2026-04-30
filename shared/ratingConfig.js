export const productTypes = ['Home', 'Auto', 'Property', 'Workers Compensation'];

export const usStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];

export const endorsementTypes = [
  'Mortgagee Change',
  'Additional Insured',
  'Named Driver Change',
  'Blanket Limit Amendment',
  'Waiver of Subrogation'
];

export const limitOptions = [100000, 250000, 500000, 1000000];
export const deductibleOptions = [1000, 2500, 5000, 10000, 25000];

export const coverageDefinitions = {
  Home: [
    { id: 'home-dwelling', name: 'Dwelling Protection', baseRate: 0.0048 },
    { id: 'home-liability', name: 'Personal Liability', baseRate: 0.0024 },
    { id: 'home-loss-use', name: 'Loss of Use', baseRate: 0.0018 }
  ],
  Auto: [
    { id: 'auto-bodily-injury', name: 'Bodily Injury', baseRate: 0.0052 },
    { id: 'auto-collision', name: 'Collision', baseRate: 0.0068 },
    { id: 'auto-comprehensive', name: 'Comprehensive', baseRate: 0.0041 }
  ],
  Property: [
    { id: 'property-building', name: 'Building Property', baseRate: 0.0057 },
    { id: 'property-bpp', name: 'Business Personal Property', baseRate: 0.0039 },
    { id: 'property-income', name: 'Business Interruption', baseRate: 0.0032 }
  ],
  'Workers Compensation': [
    { id: 'wc-employer-liability', name: 'Employer Liability', baseRate: 0.0075 },
    { id: 'wc-medical', name: 'Medical Benefits', baseRate: 0.0061 },
    { id: 'wc-wage', name: 'Wage Replacement', baseRate: 0.0084 }
  ]
};

export const defaultBusinessRules = [
  {
    id: 'rule-required-fields',
    name: 'Mandatory fields missing',
    condition: 'Effective date, expiry date, producer number, insured name, contact, and product are required',
    errorMessage: 'Complete all mandatory policy information before quoting.',
    active: true
  },
  {
    id: 'rule-date-logic',
    name: 'Invalid date range',
    condition: 'Expiry date must be after effective date',
    errorMessage: 'Expiry date must be later than the effective date.',
    active: true
  },
  {
    id: 'rule-coverage-product',
    name: 'Coverage not eligible for product',
    condition: 'A coverage can only be quoted for its configured product',
    errorMessage: 'One or more coverages are not eligible for the selected product.',
    active: true
  },
  {
    id: 'rule-limit-deductible',
    name: 'Invalid limit/deductible combination',
    condition: 'Deductible must be below 20% of the selected coverage limit',
    errorMessage: 'Deductible cannot be 20% or more of the coverage limit.',
    active: true
  }
];

export function getCoverageById(coverageId) {
  for (const [product, coverages] of Object.entries(coverageDefinitions)) {
    const coverage = coverages.find((item) => item.id === coverageId);
    if (coverage) {
      return { ...coverage, product };
    }
  }
  return null;
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Math.round(amount || 0));
}

export function normalizeCoverageSelections(draft) {
  const selectedProducts = new Set(draft.productTypes || []);
  return Object.entries(draft.coverages || {})
    .filter(([, value]) => value?.selected)
    .map(([coverageId, value]) => {
      const definition = getCoverageById(coverageId);
      if (!definition) return null;
      return {
        ...definition,
        limit: Number(value.limit || 0),
        deductible: Number(value.deductible || 0),
        eligibleProductSelected: selectedProducts.has(definition.product)
      };
    })
    .filter(Boolean);
}

export function rateModifierFor(limit, deductible) {
  const limitModifier = limit >= 1000000 ? 1.45 : limit >= 500000 ? 1.22 : limit >= 250000 ? 1.08 : 0.95;
  const deductibleModifier = deductible >= 25000 ? 0.72 : deductible >= 10000 ? 0.84 : deductible >= 5000 ? 0.92 : 1.05;
  return Number((limitModifier * deductibleModifier).toFixed(2));
}

export function calculateCoveragePremium(coverageSelection) {
  const limit = Number(coverageSelection.limit || 0);
  const deductible = Number(coverageSelection.deductible || 0);
  const baseRate = Number(coverageSelection.baseRate || 0);
  const rateModifier = rateModifierFor(limit, deductible);
  const premium = Math.max(2500, limit * baseRate * rateModifier - deductible * 0.025);

  return {
    coverageId: coverageSelection.id,
    product: coverageSelection.product,
    coverageName: coverageSelection.name,
    limit,
    deductible,
    rateModifier,
    premium: Math.round(premium)
  };
}

export function calculatePolicyPremium(draft) {
  const selectedCoverages = normalizeCoverageSelections(draft);
  const breakdown = selectedCoverages.map(calculateCoveragePremium);
  const productSurcharge = (draft.productTypes || []).length > 1 ? 1.06 : 1;
  const endorsementSurcharge = ((draft.endorsements?.types || []).length || 0) * 350;
  const subtotal = breakdown.reduce((sum, item) => sum + item.premium, 0);
  const totalPremium = Math.round(subtotal * productSurcharge + endorsementSurcharge);

  return {
    currency: 'INR',
    subtotal,
    productSurcharge,
    endorsementSurcharge,
    totalPremium,
    breakdown
  };
}

export function validateDraft(draft, businessRules = defaultBusinessRules) {
  const activeRules = new Set((businessRules || []).filter((rule) => rule.active !== false).map((rule) => rule.id));
  const errors = [];

  if (activeRules.has('rule-required-fields')) {
    const missing = [];
    if (!draft.effectiveDate) missing.push('Effective Date');
    if (!draft.expiryDate) missing.push('Expiry Date');
    if (!draft.producerNumber?.trim()) missing.push('Producer Number');
    if (!draft.insuredName?.trim()) missing.push('Insured Name');
    if (!draft.primaryContact?.trim()) missing.push('Primary Contact');
    if (!draft.productTypes?.length) missing.push('Product Type');

    if (missing.length) {
      errors.push({
        ruleId: 'rule-required-fields',
        ruleName: 'Mandatory fields missing',
        message: `Missing required fields: ${missing.join(', ')}.`
      });
    }
  }

  if (activeRules.has('rule-date-logic') && draft.effectiveDate && draft.expiryDate) {
    const effective = new Date(draft.effectiveDate);
    const expiry = new Date(draft.expiryDate);
    if (Number.isNaN(effective.getTime()) || Number.isNaN(expiry.getTime()) || expiry <= effective) {
      errors.push({
        ruleId: 'rule-date-logic',
        ruleName: 'Invalid date range',
        message: 'Expiry date must be later than the effective date.'
      });
    }
  }

  const selectedCoverages = normalizeCoverageSelections(draft);

  if (activeRules.has('rule-coverage-product')) {
    const invalidProducts = selectedCoverages.filter((coverage) => !coverage.eligibleProductSelected);
    if (invalidProducts.length) {
      errors.push({
        ruleId: 'rule-coverage-product',
        ruleName: 'Coverage not eligible for product',
        message: `${invalidProducts.map((coverage) => coverage.name).join(', ')} is not eligible for selected products.`
      });
    }
  }

  if (activeRules.has('rule-limit-deductible')) {
    const invalidLimits = selectedCoverages.filter((coverage) => coverage.deductible >= coverage.limit * 0.2);
    if (invalidLimits.length) {
      errors.push({
        ruleId: 'rule-limit-deductible',
        ruleName: 'Invalid limit/deductible combination',
        message: 'Deductible cannot be 20% or more of the coverage limit.'
      });
    }
  }

  return errors;
}

export function buildRatingTree() {
  return Object.entries(coverageDefinitions).flatMap(([product, coverages]) =>
    coverages.map((coverage) => ({
      product,
      coverageId: coverage.id,
      coverageName: coverage.name,
      ratingRows: limitOptions.flatMap((limit) =>
        deductibleOptions.map((deductible) => {
          const rateModifier = rateModifierFor(limit, deductible);
          const premium = calculateCoveragePremium({ ...coverage, product, limit, deductible }).premium;
          return { limit, deductible, rateModifier, premium };
        })
      )
    }))
  );
}

export function createInitialDraft() {
  return {
    effectiveDate: '',
    expiryDate: '',
    productTypes: [],
    producerNumber: '',
    insuredName: '',
    primaryContact: '',
    locations: [],
    coverages: {},
    endorsements: {
      types: [],
      documents: []
    }
  };
}
