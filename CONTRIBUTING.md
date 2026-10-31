# Contributing

Thanks for your interest in improving Compute Ledger. Contributions are welcome, especially corrections to source data, methodology improvements, and fixes that make the calculations easier to understand.

## Before you start

- Search existing issues and pull requests to avoid duplicating work.
- For substantial changes, open an issue first to discuss the proposed approach.
- Keep pull requests focused and explain the reasoning behind material changes.
- Be respectful and constructive in discussions.

## Development setup

Requirements:

- Node.js 22
- pnpm 12.16.1 (the repository pins this version in `package.json`)

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Before submitting a change, run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Do not use npm or Yarn to install dependencies. Commit changes to `package.json` and `pnpm-lock.yaml` together whenever dependencies change.

## Data and research contributions

Compute Ledger is an independent model of publicly observable information. Data contributions must preserve the distinction between provider-published facts, editorial classifications, assumptions, and calculated estimates.

For each material fact:

- Prefer an official provider source.
- Include the source URL and the date the information was retrieved or verified.
- Preserve relevant context such as region, currency, billing period, model/version, and effective date.
- Do not infer unpublished internal costs, subscriber usage, revenue, profitability, or loss-making customers.
- Use explicit unknown or unverified values rather than filling gaps with guesses.
- Update methodology notes when a change affects definitions or calculation assumptions.

Do not present API list prices or illustrative accelerator allocations as a provider's actual internal inference costs.

## Pull requests

1. Fork the repository and create a topic branch.
2. Make the smallest coherent change.
3. Add or update tests when changing calculations or data validation.
4. Run the checks listed above.
5. Open a pull request against `main` and describe the motivation, implementation, evidence/sources, and testing performed.

All changes to `main` are reviewed under the repository's CODEOWNERS and branch rules. A pull request is not guaranteed to be merged; the maintainer may request changes or close it.

## Code of conduct

Be considerate, professional, and welcoming. Harassment, personal attacks, and discriminatory behaviour are not acceptable. The maintainer may remove contributions or restrict participation that conflicts with these expectations.
