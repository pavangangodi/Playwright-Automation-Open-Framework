# SurePath Policy Console Implementation Blueprint

## 1. UI Design Structure

### Global Shell
- Left sidebar with brand, primary modules, and stepper-style Create Policy progress.
- Sticky operational header with API/database status.
- Main content uses animated glass panels, dense enterprise spacing, and stable `data-testid` selectors.

### Create Policy
- **Policy Info:** grouped cards for effective/expiry dates, searchable product multi-select, producer number, insured name, and manual primary contact. Includes date and required-field validation.
- **Location Details:** product selector, searchable US state dropdown, and selected location cards/tags per product.
- **Coverage Details:** dynamic coverage accordions filtered by selected product. Each coverage exposes limit, deductible, rate modifier, and real-time premium preview.
- **Endorsements:** endorsement type selection, dummy document upload, final premium, Quote Policy, Bind Policy, and a forms screen that unlocks after quote or bind.

### Search Policy
- Search by quote number, policy number, or insured name.
- Results show status, quote number, policy number, products, and premium summary.

### Admin
- Business Rules table with rule name, condition, error message, and active/inactive toggle.
- Rating Engine tab with expandable tree/table: Coverage -> Limit -> Deductible -> Rate Modifier -> Premium.

## 2. React Component Structure

```text
src/
  App.jsx                         # App shell, module switching, toast lifecycle
  components/
    Inputs.jsx                    # Field, text input, searchable select, multi-select
    Sidebar.jsx                   # Module navigation and wizard progress stepper
    Toast.jsx                     # Success/error toast region
  modules/
    CreatePolicy.jsx              # Multi-step wizard, quote/bind/forms behavior
    SearchPolicy.jsx              # Policy search workflow
    Admin.jsx                     # Business rules and rating config views
  services/
    api.js                        # REST client wrapper
  styles.css                      # Tailwind component layer and responsive polish
shared/
  ratingConfig.js                 # Shared coverage, validation, and premium logic
```

## 3. Backend API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API and database provider status |
| `GET` | `/api/products` | Product, state, endorsement, and coverage metadata |
| `POST` | `/api/rating/preview` | Validate draft and return premium preview |
| `POST` | `/api/policies/quote` | Validate, generate quote number, store policy |
| `POST` | `/api/policies/:quoteNumber/bind` | Generate policy number and bind quoted policy |
| `GET` | `/api/policies/search?q=` | Search by quote, policy, or insured name |
| `GET` | `/api/policies/:quoteNumber/forms` | Return generated forms once quoted or bound |
| `GET` | `/api/business-rules` | List validation rules |
| `PATCH` | `/api/business-rules/:id` | Toggle rule active state |
| `GET` | `/api/rating-config` | Rating engine tree/table data |

## 4. Database Schema

MongoDB is wired through Mongoose in `server/models.js`; the app falls back to an in-memory store when `MONGO_URI` is not set.

```js
Policy {
  quoteNumber,
  policyNumber,
  status: 'DRAFT' | 'QUOTED' | 'BOUND',
  effectiveDate,
  expiryDate,
  productTypes: [String],
  producerNumber,
  insuredName,
  primaryContact,
  locations: [{ product, state }],
  coverages: Mixed,
  endorsements: { types: [String], documents: [{ name, uploadedAt }] },
  premium: {
    currency,
    subtotal,
    productSurcharge,
    endorsementSurcharge,
    totalPremium,
    breakdown: [{ coverageId, product, coverageName, limit, deductible, rateModifier, premium }]
  }
}

BusinessRule {
  id,
  name,
  condition,
  errorMessage,
  active
}
```

## 5. Sample Premium Calculation Logic

```js
rateModifier = limitModifier * deductibleModifier
coveragePremium = max(2500, limit * baseRate * rateModifier - deductible * 0.025)
totalPremium = subtotal * productSurcharge + endorsementSurcharge
```

Example from `shared/ratingConfig.js`:

```js
Home Coverage -> 100000 limit -> 5000 deductible -> 0.87 modifier -> Premium INR X
```

## 6. Sample Playwright Test Cases

Implemented in `tests/policy-flow.spec.js`:
- Create policy through multi-step wizard and quote it.
- Validate business rule for invalid limit/deductible through API and UI error toast.
- Quote, bind, and search the bound policy by insured name.

Testability details:
- Stable selectors use `data-testid` on navigation, fields, dynamic coverage accordions, quote/bind buttons, generated forms, search results, admin tabs, and rules.
- Tests also assert API validation via `/api/rating/preview`.
- The demo reset endpoint is available outside production at `/api/test/reset`.

## 7. Styling Approach

- Tailwind CSS with a component layer for repeated controls: panels, tabs, tags, toggles, accordions, input controls, and buttons.
- Premium enterprise palette: white/cool-gray surfaces, deep ink text, teal action states, amber highlights, indigo rating accents, and emerald success states.
- Subtle glassmorphism via translucent panels, blurred shell surfaces, soft shadows, and restrained radial background light.
- Micro-animations: fade-up entrances, hover lift, accordion transitions, active step highlighting, and focus rings.
- Desktop-first layout with responsive grids and sidebar width adjustment for smaller screens.
