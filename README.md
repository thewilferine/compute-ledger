# The Compute Ledger

An independent, source-backed guide to getting the most capability from AI for the money you spend.

Compute Ledger helps individuals compare AI subscriptions, model access, usage policies and published API prices. It favours transparent evidence and practical trade-offs over a universal ranking or an opaque value score.

## What you can do

- **Value Explorer:** compare consumer plans in a chosen display currency (defaulted from the browser's locale to GBP, USD or EUR), sorted by converted monthly-equivalent price, model access and published usage terms. See original prices and dated ECB exchange rates; filter by budget and explore budget-conscious, everyday and heavy-use profiles.
- **Provider directory:** see which AI labs and platforms are covered by the catalogue.
- **Model catalogue:** explore curated frontier models, modalities, context windows, availability and editorial groupings.
- **Subscription catalogue:** inspect regional prices, billing periods, access summaries and usage-limit policies.
- **API workload calculator:** estimate the customer-facing API list-price equivalent of a workload.
- **Methodology and sources:** inspect where information came from and what the comparisons can and cannot establish.

There is no single best AI plan for everyone. A plan's value depends on the models and tools you need, how often you use them, the limits you encounter and what you are willing to pay. The Value Explorer deliberately avoids collapsing unlike usage policies into a misleading score.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Recharts + Lucide
- Zod for runtime data validation
- Vitest for unit tests
- JSON catalogue committed to Git
- GitHub Actions for validation and GitHub Pages deployment

There is no application backend or database. Data is published as a versioned JSON catalogue and comparisons run in the browser. The API calculator uses published customer prices; these are not providers' internal serving costs.

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
- `src/components/ui/`: shadcn components.
- `public/data/`: versioned, public JSON datasets and immutable catalogue history snapshots.
- `scripts/`: data maintenance and deterministic catalogue history tooling.
- `.github/workflows/`: CI validation and Pages deployment.

## Data quality principles

1. Attribute every material published fact to a source and retrieval date.
2. Keep source facts separate from assumptions and calculated estimates.
3. Preserve region, currency, billing period and observation date for prices.
4. Preserve original currencies. Cross-currency comparisons must use dated, attributed reference rates and retain the original advertised price.
5. Never treat provider-relative usage multipliers as comparable quotas across providers.
6. Prefer explicit unknowns and limitations over invented allowances or false precision.

See [the methodology notes](docs/methodology.md) for definitions, comparison rules and known omissions. Catalogue snapshots, change records, validation and retention are described in [catalogue history](docs/catalogue-history.md). Release notes are in [CHANGELOG.md](CHANGELOG.md).

## Current data coverage

The catalogue tracks major AI model labs and platform providers: OpenAI, Anthropic, Google, DeepSeek, xAI, Meta, Mistral, Alibaba/Qwen, Moonshot AI, Z.ai and NVIDIA. Selected consumer subscription observations currently cover OpenAI, Anthropic, Google and xAI. They include annual billing, published relative usage tiers, dynamic limits and shared-pool policies where verified. API pricing records include published standard, batch, speed, peak/off-peak and long-context tiers, plus cache rates and effective dates where providers publish them.

This is a curated catalogue, not an exhaustive inventory of every model, plan, region or promotion. Missing information means it has not yet been verified; it does not mean the provider has no such product or feature. Model groupings are editorial, not provider-defined capability rankings.

## Deployment

The deployment workflow publishes the Vite `dist/` directory to GitHub Pages. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

The Vite base path is configured for `https://thewilferine.github.io/compute-ledger/` in CI and `/` during local development.

## Licence

Not yet selected.
