# Refresh candidates

This directory contains machine-collected evidence and discovery candidates that have **not** been promoted into the canonical catalogue.

- `subscriptions.json`: official plan/help page observations, linked to existing plan IDs, with nearby currency mentions for review. A mention is not automatically interpreted as a plan price, region or billing period.
- `models.json`: OpenRouter model discovery for the providers tracked by Compute Ledger. It is an aggregator catalogue, not proof of direct API availability or provider lifecycle.
- `api-pricing.json`: official provider pricing-page observations plus OpenRouter routed rates. Aggregator rates are kept separate from direct provider list prices.

These files are intentionally suitable for human review. Do not treat a candidate as verified simply because the collector retrieved it. Promote values into `catalogue.json` only after checking the linked primary source, model/version mapping, region, billing unit, tier and effective date.

The collectors write each output atomically after successful retrieval. A failed source request stops the refresh and preserves the previously committed file.
