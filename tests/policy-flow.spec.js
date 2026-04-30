import { expect, test } from '@playwright/test';

const homeCoverage = 'home-dwelling';

async function resetDemoStore(request) {
  await request.post('/api/test/reset');
}

async function selectProduct(page, product = 'Home') {
  await page.getByTestId('product-type-button').click();
  await page.getByTestId('product-type-search').fill(product);
  await page.getByTestId(`product-type-option-${product}`).click();
  await page.getByTestId('product-type-button').click();
}

async function fillPolicyInfo(page, insuredName = 'Acme Manufacturing LLC') {
  await selectProduct(page, 'Home');
  await page.getByTestId('producer-number-input').fill('PRD-20491');
  await page.getByTestId('insured-name-input').fill(insuredName);
  await page.getByTestId('primary-contact-input').fill('Nina Shah - nina@example.com');
  await page.getByTestId('wizard-next-button').click();
}

async function addLocation(page) {
  await page.getByTestId('location-product-select').selectOption('Home');
  await page.getByTestId('state-select-button').click();
  await page.getByTestId('state-select-search').fill('CA');
  await page.getByTestId('state-select-option-CA').click();
  await page.getByTestId('add-location-button').click();
  await expect(page.getByTestId('location-card-Home-CA')).toBeVisible();
  await page.getByTestId('wizard-next-button').click();
}

async function configureCoverage(page, { limit = '250000', deductible = '5000' } = {}) {
  await page.getByTestId(`coverage-toggle-${homeCoverage}`).check();
  await page.getByTestId(`coverage-limit-${homeCoverage}`).selectOption(limit);
  await page.getByTestId(`coverage-deductible-${homeCoverage}`).selectOption(deductible);
  await expect(page.getByTestId('premium-total')).not.toHaveText('₹0');
  await page.getByTestId('wizard-next-button').click();
}

async function quotePolicy(page, insuredName = 'Acme Manufacturing LLC') {
  await page.goto('/');
  await fillPolicyInfo(page, insuredName);
  await addLocation(page);
  await configureCoverage(page);
  await page.getByTestId('endorsement-type-Mortgagee Change').click();
  await page.getByTestId('quote-policy-button').click();
  await expect(page.getByTestId('toast-success')).toContainText('Quote generated');
  await expect(page.getByTestId('quote-result-card')).toBeVisible();
  await expect(page.getByTestId('generated-forms-list')).toBeVisible();
  return page.getByTestId('quote-number-value').innerText();
}

test.beforeEach(async ({ request }) => {
  await resetDemoStore(request);
});

test('creates a policy through the multi-step wizard and quotes it', async ({ page }) => {
  await quotePolicy(page, 'Acme Manufacturing LLC');

  await expect(page.getByTestId('quote-number-value')).toContainText('QTE-');
  await expect(page.getByTestId('forms-screen')).toContainText('Enabled');
  await expect(page.getByTestId('final-premium')).not.toHaveText('₹0');
});

test('validates invalid limit and deductible combinations through API and UI', async ({ page, request }) => {
  const apiResponse = await request.post('/api/rating/preview', {
    data: {
      effectiveDate: '2026-05-01',
      expiryDate: '2027-05-01',
      productTypes: ['Home'],
      producerNumber: 'PRD-20491',
      insuredName: 'Invalid Limit LLC',
      primaryContact: 'qa@example.com',
      locations: [{ product: 'Home', state: 'CA' }],
      coverages: {
        [homeCoverage]: { selected: true, limit: 100000, deductible: 25000 }
      },
      endorsements: { types: [], documents: [] }
    }
  });
  expect(apiResponse.status()).toBe(422);
  const payload = await apiResponse.json();
  expect(payload.errors[0].ruleId).toBe('rule-limit-deductible');

  await page.goto('/');
  await fillPolicyInfo(page, 'Invalid Limit LLC');
  await addLocation(page);
  await configureCoverage(page, { limit: '100000', deductible: '25000' });
  await page.getByTestId('quote-policy-button').click();
  await expect(page.getByTestId('toast-error')).toContainText('Deductible cannot be 20% or more');
});

test('quotes, binds, and finds a policy from search', async ({ page }) => {
  await quotePolicy(page, 'Bright Harbor Holdings');
  await page.getByTestId('bind-policy-button').click();

  await expect(page.getByTestId('toast-success').filter({ hasText: 'Policy bound' })).toBeVisible();
  await expect(page.getByTestId('policy-number-value')).toContainText('POL-');

  await page.getByTestId('nav-search').click();
  await page.getByTestId('policy-search-input').fill('Bright Harbor');
  await page.getByTestId('policy-search-button').click();

  await expect(page.getByTestId('policy-search-result')).toContainText('Bright Harbor Holdings');
  await expect(page.getByTestId('result-policy-number')).toContainText('POL-');
  await expect(page.getByTestId('result-quote-number')).toContainText('QTE-');
});
