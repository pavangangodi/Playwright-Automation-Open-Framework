# Playwright Automation Open Framework

A modern full-stack insurance policy management demo inspired by enterprise policy administration workflows. It combines a React + Tailwind UI, Express REST APIs, MongoDB-ready persistence, shared premium/rule logic, and Playwright end-to-end automation.

## What This Includes

- Create Policy wizard with Policy Info, Location Details, Coverage Details, and Endorsements.
- Dynamic product coverages, premium preview, quote and bind flow, and generated forms unlock.
- Search Policy module for quote number, policy number, and insured name.
- Admin module for business rules and rating configuration.
- Stable `data-testid` selectors for automation.
- Playwright tests for create policy, negative rule validation, quote, bind, and search.
- MongoDB support through `MONGO_URI`, with an in-memory fallback for local demos.

## Tech Stack

- React
- Tailwind CSS
- Node.js
- Express
- MongoDB / Mongoose
- Playwright
- Vite

## Run Locally

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

API health:

```text
http://127.0.0.1:4000/api/health
```

## Test

```powershell
npm run build
npm run test:chrome
```

If Playwright browsers are missing:

```powershell
npx playwright install chromium
```

## MongoDB

Create a local `.env` or set the environment variable before starting the server:

```powershell
$env:MONGO_URI="mongodb://127.0.0.1:27017/playwright-automation-open-framework"
npm run dev
```

Do not commit real credentials or secrets.

## Documentation

See [docs/implementation-blueprint.md](docs/implementation-blueprint.md) for UI structure, component structure, API endpoints, schema, rating logic, and Playwright test coverage.
