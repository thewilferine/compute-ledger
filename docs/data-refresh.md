# Automated data refresh

Compute Ledger uses domain-specific collectors behind a shared runner. Collectors retrieve public source data, validate their response, and write dated observations or discovery candidates. The workflow proposes changes through a pull request; it does not publish commercial catalogue changes directly to `main`.

## Workflow

The `.github/workflows/refresh-data.yml` workflow:

1. Validates the current catalogue with the Zod schema and cross-record integrity checks.
2. Runs the selected domain collectors.
3. Validates the catalogue again; benchmark observations are also checked against their dedicated schema.
4. Runs type-checking, tests and the production build.
5. Opens or updates a pull request only when files under `public/data/` have changed.
6. Adds a human-readable report to the Actions run summary and pull request.

Collector outputs are written atomically. Retrieval failures are isolated at source level wherever partial collection is meaningful; malformed catalogue data or failed validation still fails the workflow. A failed source never becomes an empty catalogue and never implies that a model, plan or price has been removed. Last-known-good candidate observations are retained when a whole upstream feed is unavailable.

## Source registry and failure handling

Every attempted automated source is recorded in `public/data/refresh-candidates/source-registry.json`. Each entry includes its stable source ID, URL, publisher, domain, collection strategy, automation suitability, first-seen time, last attempt, last successful retrieval, current status, most recent error and consecutive failure count.

Statuses are deliberately distinct:

- `fetched`: the endpoint returned a usable response.
- `blocked`: the source explicitly returned HTTP 403. This is an access decision, not evidence that the source content changed.
- `rate_limited`: HTTP 429. The collector does not hammer the endpoint with retries.
- `transient_failure`: server-side 5xx, timeout or network failure.
- `unavailable`: other unsuccessful HTTP responses.
- `invalid_response`: response parsing or format failure.
- `manual_review`: a source such as a PDF that is retained for a human rather than automatically parsed.

A failed attempt updates the latest status and error but preserves `lastSuccessfulAt`. Per-source failures in subscription pages, official pricing pages and benchmark leaderboards do not stop unrelated sources from being collected. If a complete upstream feed (for example the model discovery API) is unavailable, its previous candidate file is left untouched. The source registry itself still records the failed attempt.

The refresh report derives its per-domain status from the latest source-registry entries after each collector exits successfully. A domain is labelled **Updated successfully** only when all registered sources were fetched; it is **Partial** when any source failed or has an unrecognised status; and **Review required** when sources were fetched but at least one is explicitly marked for manual review. The report includes fetched/total counts, individual failure categories and manual-review counts in both the Actions step summary and generated pull-request body. A source-level failure does not fail the workflow by itself. A collector process failure is reported separately as **Collector failed** and still fails the refresh job after the summary has been written, preventing a misleading data PR.

The registry describes collection health, not source truth or commercial facts. It does not infer that a provider is blocking Compute Ledger specifically: HTTP 403 only establishes that the request was forbidden. Do not disguise the workflow as a browser, rotate addresses to evade controls or bypass access restrictions. Prefer documented APIs, public feeds and provider-supported data access; otherwise retain the source as manual review.

## Schedules

- **Exchange rates:** weekdays at 16:30 UTC, using ECB reference rates through Frankfurter.
- **Subscriptions, models, API pricing and benchmarks:** Mondays at 07:15 UTC.
- **Manual runs:** Actions → Refresh catalogue data → Run workflow, then select one domain or `all`.

The weekly run also refreshes exchange rates because `all` includes every domain. Manual dispatch supports `exchange-rates`, `subscriptions`, `models`, `api-pricing`, `benchmarks` and `all`.

## Domain collectors

### Consumer subscriptions

`scripts/collect-subscriptions.mjs` fetches the official subscription/help pages already linked to catalogue subscription plans. It records source URL, publisher, retrieval date, linked plan IDs, page metadata and nearby currency/price mentions.

This is source evidence, not an automatic price parser. A price mention is not assigned to a plan, region, billing period or usage entitlement without review. Subscription pages often localise prices or describe limits dynamically; those facts must be checked in context before changing canonical plan records.

### Models

`scripts/collect-models.mjs` uses the public OpenRouter model catalogue to discover model IDs, names, context lengths, modalities, creation/expiry metadata and provider associations for the providers tracked by Compute Ledger.

OpenRouter is an aggregator. Its model presence does not prove direct provider API availability, regional availability or provider lifecycle status. The output is a discovery candidate list and does not automatically add, rename or retire canonical models. Confirm candidates against provider documentation and preserve version-specific identifiers.

### API pricing

`scripts/collect-api-pricing.mjs` captures the official pricing sources currently referenced by the catalogue, including extracted currency mentions and page metadata. PDF sources are recorded as requiring manual review rather than being treated as text.

It also collects machine-readable OpenRouter prompt, completion and cache-read rates, normalised to USD per million tokens. These are explicitly labelled **OpenRouter routed rates** and are stored separately from direct provider list prices. They must never be substituted for provider pricing. Official price mentions are evidence only until a reviewer can identify the exact model, version, modality, tier, unit and effective date.

### Independent benchmarks

`scripts/collect-benchmarks.mjs` reads the public Hugging Face leaderboard APIs for SWE-bench Verified and GSM8K. Each result records benchmark identity, external model ID, score, scale, observation date, source/model-card URL, leaderboard URL, methodology URL, verification status and submission metadata where available.

Unverified submissions are retained but clearly marked `unverified`; they must not be presented as independently verified results. Evaluation date remains unknown when the source does not provide one. Model-to-catalogue mapping is exact-match only; unknown mappings remain null. Benchmarks are separate measurements and must not be combined into a universal score.

The benchmark dataset is stored separately at `public/data/benchmarks.json`, with a dedicated Zod schema. It is not yet part of the user-facing model comparison UI.

## Candidate data and review policy

Machine-collected observations live in `public/data/refresh-candidates/`. See its README for the meaning of each file. Candidate data is not canonical catalogue data. Reviewers should verify primary sources, model/version identity, region, price unit, billing period, tier, effective date, benchmark methodology and reuse terms before promotion.

This separation is intentional: automated retrieval can reliably identify changes and surface evidence, but it cannot always resolve regional plan prices, model aliases, dynamic limits or benchmark methodology without human judgement.

## Adding a collector

1. Add a dedicated script under `scripts/`; keep provider-specific parsing out of the orchestrator.
2. Use `scripts/lib/refresh-io.mjs` for bounded HTTP requests, source status classification, registry updates and atomic JSON writes.
3. Validate complete responses before writing. Reject missing fields, unexpected units, invalid dates and incomplete records.
4. Preserve source URLs, publishers, observation dates and effective dates where provided.
5. Never delete or downgrade a last-known-good record because a source is unavailable; preserve the last successful timestamp in the source registry.
6. Register the command and output paths in `scripts/lib/data-refresh.mjs`.
7. Add tests for parsing, valid/invalid responses, provenance and failure behaviour.
8. Update this document and the candidate-data README.

Prefer official provider documentation. Use aggregator data only when clearly labelled as aggregator data. Do not silently infer missing facts or bypass source terms.

## Local use

```bash
npm install
npm run data:refresh -- subscriptions
npm run data:refresh -- models
npm run data:refresh -- api-pricing
npm run data:refresh -- benchmarks
npm run data:refresh -- all
npm run typecheck
npm test
npm run build
```

## Permissions

The workflow requires `contents: write` and `pull-requests: write`. Repository settings must also allow GitHub Actions to create pull requests: **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**. If this setting is disabled, collectors can run but GitHub will reject automated PR creation.
