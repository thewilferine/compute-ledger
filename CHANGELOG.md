# Changelog

## Unreleased

- Add weekly domain collectors for subscription source observations, model discovery, API pricing evidence and provenance-aware benchmark leaderboards. Keep aggregator pricing and unverified benchmark submissions explicitly labelled and separate from canonical provider data.

- Add a domain-oriented GitHub Actions data refresh pipeline with scheduled ECB exchange-rate updates, manual domain selection, validation, test/build gates, refresh reports and reviewed pull requests. Other catalogue domains remain explicit manual-review inputs until reliable collectors are added.


## Unreleased

### Added
- Immutable, validated catalogue snapshots and deterministic record-level change sets, indexed for future history views.
- Daily and change-triggered GitHub Actions workflow for catalogue history, with a baseline snapshot on first run.
- Selected-currency subscription comparison with converted monthly prices, original-price disclosure and dated ECB reference rates.
- Daily GitHub Actions workflow to refresh ECB reference rates through Frankfurter.
- Value Explorer for comparing consumer plans by currency, monthly-equivalent price, budget and published usage terms.
- Budget-conscious, everyday and heavy-use guidance profiles.
- Explicit plan evidence labels without an opaque cross-provider value score.

### Changed
- Value Explorer now sorts all subscription plans together by estimated monthly-equivalent price in the selected currency.
- Repositioned Compute Ledger around helping individuals get more AI capability for their money.
- Rewrote the project overview, README and methodology around practical plan comparisons.
- Clarified that provider-relative usage multipliers are not comparable across providers.

## 1.0.0 — 2026-10-31

### Added
- Curated frontier model catalogue spanning 11 major AI labs and platform providers.
- Editorial model groupings: flagship, balanced, efficient, specialist and previous-generation.
- Source-backed consumer subscription observations for OpenAI, Anthropic, Google and xAI.
- Published subscription usage-policy descriptions, including dynamic limits, tier multipliers and shared weekly pools.
- API-equivalent workload calculator using published input, output and cache-read prices.
- Separate illustrative accelerator-allocation calculator.
- Effective-date-aware API pricing observations, including cache-write rates and pricing tiers.

### Research and modelling boundaries
- Public API list prices are customer-facing prices, not internal inference costs.
- Public subscription prices and usage policies do not disclose actual per-subscriber revenue or workload.
- Calculator outputs are scenarios, not measured provider costs, losses or profits.
- Model coverage is curated, not exhaustive; unverified model IDs, prices and limits remain explicitly unknown.
