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

There is no application backend or database. Calculations run in the browser. The calculator separates an API list-price workload equivalent from an illustrative hardware-allocation scenario; neither is presented as a provider internal cost.

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

The catalogue tracks major AI model labs and platform providers: OpenAI, Anthropic, Google, DeepSeek, xAI, Meta, Mistral, Alibaba/Qwen, Moonshot AI, Z.ai, and NVIDIA. It includes frontier model entries with official source links, selected consumer subscription observations from OpenAI, Anthropic, Google and xAI, including annual billing, published relative usage tiers, dynamic limits and shared-pool policies, and published API token rates where verified. API pricing distinguishes standard, batch, speed, peak/off-peak and long-context tiers, and records prompt-cache read/write rates and effective dates where providers publish them. This is a curated frontier catalogue, not an exhaustive inventory of every model or variant. The Models view distinguishes flagship, balanced, efficient, specialist and previous-generation entries using an explicitly editorial grouping; it records model IDs and context windows only when verified. API rates are customer-facing list prices, not internal inference costs. Missing prices, specifications or plans mean they have not yet been verified; they do not mean the provider has none. Model status and release dates are recorded where supported by official sources.

## Deployment

The deployment workflow publishes the Vite `dist/` directory to GitHub Pages. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

The Vite base path is configured for `https://thewilferine.github.io/compute-ledger/` in CI and `/` during local development.

## Licence

Not yet selected.
