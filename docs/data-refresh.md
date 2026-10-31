# Automated data refresh

Compute Ledger uses a small, domain-oriented refresh pipeline. The pipeline is responsible for running collectors, validating the existing catalogue, reporting what happened and proposing data changes through a pull request. It does not publish commercial catalogue changes directly to `main`.

## Workflow

The `.github/workflows/refresh-data.yml` workflow:

1. Selects one domain or all registered domains.
2. Validates the current catalogue with the Zod schema and cross-record integrity checks.
3. Runs each selected automated collector.
4. Validates the catalogue again.
5. Runs type-checking, tests and the production build.
6. Opens or updates a single pull request containing changed data files. If no files changed, no pull request is created.
7. Adds a human-readable refresh report to the Actions run summary and pull request.

A collector must validate its complete response before writing its output. A failed collector exits non-zero, so the workflow does not create a pull request from a partial refresh. The existing committed data remains the last-known-good version. Do not treat an unavailable source as evidence that a model or plan has been removed.

## Schedule and manual runs

The scheduled run executes the exchange-rate collector on weekdays at 16:30 UTC, after the normal ECB publication window. This retains the existing weekday cadence.

Use **Actions → Refresh catalogue data → Run workflow** to choose a domain:

- `all`: run every registered domain and report domains that still require manual review.
- `exchange-rates`: fetch ECB reference rates through Frankfurter.
- `subscriptions`, `models`, `api-pricing` or `benchmarks`: currently report the manual-review requirement without changing catalogue data.

The latter domains are deliberately not scraped speculatively. Their sources require interpretation or reliable machine-readable interfaces before automated updates are safe.

## Collector registry

The registry lives in `scripts/lib/data-refresh.mjs`. Each entry declares its label, cadence, automation status, command, expected output and source description. To add a collector:

1. Add a dedicated script under `scripts/`; keep provider-specific parsing out of the orchestrator.
2. Parse and validate the complete response before writing any file. Reject missing fields, unexpected currencies/units, invalid dates and incomplete records.
3. Preserve source attribution and observation/effective dates in the resulting data.
4. Write atomically only after all validation succeeds. Never delete or downgrade a last-known-good record because a source is unavailable.
5. Add the command and output paths to the registry.
6. Add unit tests for parsing, valid and invalid responses, change detection and failure behaviour.
7. Extend the PR workflow's allowed data paths if the collector writes a new dataset.
8. Update this document with its source, schedule and limitations.

Use official provider documentation and pricing pages where possible. If a source cannot be parsed reliably, leave that domain as manual review and explain why in the registry.

## Local use

Run one domain:

```bash
node --experimental-strip-types scripts/refresh-data.mjs exchange-rates
```

Run all registered domains:

```bash
node --experimental-strip-types scripts/refresh-data.mjs all
```

The exchange-rate collector can also be run directly:

```bash
node scripts/update-exchange-rates.mjs
```

Install dependencies and run the normal checks before proposing a change:

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Permissions

The workflow requires `contents: write` and `pull-requests: write`. Repository settings must also allow GitHub Actions to create pull requests: **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**. If this repository setting is disabled, the workflow can run collectors but GitHub will reject automated PR creation.
