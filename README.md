# The Compute Ledger

An independent, source-backed explorer for the economics of AI inference and consumer subscriptions.

The project models plausible serving costs from public information and explicit assumptions. It does **not** claim access to providers' internal costs, actual per-user profitability, or proof that a particular user creates a loss.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Recharts + Lucide
- Zod for runtime data validation
- Vitest for unit tests
- JSON catalogue committed to Git
- GitHub Actions for validation and GitHub Pages deployment

There is no application backend or database. Calculations run in the browser.

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Repository layout

- `src/calculations/`: deterministic modelling functions, independent of UI.
- `src/data/`: Zod schemas and catalogue loading.
- `src/features/`: product features as they are introduced.
- `src/components/ui/`: shadcn components.
- `public/data/`: versioned, public JSON datasets.
- `.github/workflows/`: CI validation and Pages deployment.

## Data quality principles

1. Attribute every material published fact to a source and retrieval date.
2. Keep source facts separate from assumptions and calculated estimates.
3. Preserve region, currency, billing period, and observation date for prices.
4. Prefer ranges and scenario analysis over false precision.
5. Review material data changes through pull requests.
6. Never describe a modelled estimate as a provider's financial disclosure.

See [the methodology notes](docs/methodology.md) for the modelling boundaries, definitions and known omissions.

## Current data coverage

The catalogue currently includes a small, source-backed sample of provider records, consumer subscription observations, and API token rates. API rates are customer-facing list prices, not internal inference costs. The dataset records source URLs and observation dates and is validated at runtime with Zod. Coverage is intentionally incomplete: do not interpret missing providers or models as having no API price or no serving cost.

## Deployment

The deployment workflow publishes the Vite `dist/` directory to GitHub Pages. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

The Vite base path is configured for `https://thewilferine.github.io/compute-ledger/` in CI and `/` during local development.

## Licence

Not yet selected.
