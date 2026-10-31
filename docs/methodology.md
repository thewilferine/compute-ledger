# Methodology and comparison boundaries

## Project objective

Compute Ledger helps individuals get the most capability from AI for the money they spend. It compares public consumer subscription prices, model and feature access, published usage policies and customer-facing API rates.

The project does not claim that one provider is universally best. Value depends on an individual's workload, preferences, region, budget and tolerance for usage limits.

## Evidence categories

- **Published fact:** a price, plan limit, model specification or other detail stated by a primary source.
- **External estimate:** a third-party estimate with its own methodology and limitations.
- **Modelling assumption:** an input selected to explore a scenario.
- **Calculated estimate:** an output produced from documented inputs and a deterministic formula.
- **Editorial guidance:** a qualitative explanation or grouping created by this project. It is not a provider claim or benchmark result.

These categories must remain distinguishable in the UI and data model.

## Value Explorer comparison rules

The Value Explorer is intentionally evidence-led rather than score-led:

1. Plans are compared only within the selected currency. A currency conversion must not be implied without a dated, cited exchange rate.
2. Annual plans are displayed using the arithmetic monthly equivalent (annual price divided by twelve), while the actual annual amount billed remains visible.
3. Plans are ordered by monthly-equivalent price. A budget filter can narrow the list.
4. Usage-limit descriptions are shown as published: dynamic limits, provider-relative tier multipliers, shared pools and unpublished limits remain distinct.
5. A provider's highest published multiplier is labelled only relative to that provider's own plan tiers. A 5× allowance at one provider is not assumed to equal 5× at another.
6. Model and feature access summaries are displayed as source-backed descriptions, not translated into a synthetic capability score.
7. The lowest-priced label means only the lowest price in the currently filtered view. It is not a claim of best overall value.

The budget-conscious, everyday and heavy-use profiles provide decision guidance, not different hidden scoring algorithms. A useful future cross-provider capability ranking would require comparable, independently maintained task benchmarks and better evidence about practical usage allowances.

## Subscription observations

Subscription records are retail price observations, not recognised revenue or inference budgets. Each observation preserves advertised currency, region, billing period and date. Regional taxes, app-store pricing, promotions and checkout conditions can change the final amount.

Usage policy is recorded separately from price and model access. The catalogue distinguishes dynamic limits, published relative tier multipliers, shared usage pools and cases where a limit has not been published. A multiplier such as 5× Pro is not a token quota. A shared pool is not a count of equivalent requests: compute-intensive features can consume more capacity than simple chat. Where a provider does not publish a fixed allowance, the project must not invent one.

## API list-price workload comparison

The API-equivalent calculator uses a user-defined monthly workload and a selected published API price tier. It calculates:

- Total input tokens = input tokens per request × requests per month
- Cached input tokens = total input tokens × assumed cache-hit share
- Uncached input tokens = total input tokens − cached input tokens
- API-equivalent price = (uncached input × input rate + cached input × cache-read rate + output input × output rate) ÷ 1,000,000

If a provider has not published a separate cache-read rate for the selected tier, cached input is priced at the standard input rate rather than assuming an undocumented discount. Cache writes, tools and non-token modalities are excluded unless explicitly represented. The calculator only offers price observations effective on the catalogue snapshot date. It compares plan prices only in the same currency; annual plan fees are divided by twelve for a monthly equivalent.

API list prices are customer-facing commercial prices, not estimates of internal GPU, memory, power or fleet costs. They can help users compare API and subscription purchasing options, but they do not establish provider cost or profitability.

## Infrastructure allocation scenario

The separate hardware calculator expresses an illustrative output-token workload as an allocated accelerator cost:

- Effective throughput = sustained throughput × utilisation
- Serving seconds = output tokens ÷ effective throughput
- Accelerator cost = (serving seconds ÷ 3,600) × accelerator hourly cost
- Estimated total = accelerator cost × infrastructure overhead multiplier

The hourly accelerator allocation, throughput, utilisation and overhead are user-editable assumptions. This is deliberately a small building block, not a complete inference cost model. It does not account for prompt/prefill tokens, batching interactions, KV cache, model parallelism, quantisation, accelerator memory, multi-GPU topology, speculative decoding, multimodal processing, idle capacity allocation or provider-specific fleet scheduling. It must not be used as a claim about a provider's actual serving costs.

## Important limitations

- Public plan prices do not reveal net revenue after taxes, payment fees or app-store commissions.
- Public usage descriptions do not reveal average subscriber workloads, throttling frequency or actual available capacity.
- Provider-relative usage multipliers are not comparable across providers.
- API list prices are not internal inference costs.
- Model access and usage policies can vary by region, account, rollout, demand and time.
- A curated catalogue cannot represent every plan, promotion, model version or regional offer.
- The project does not measure an individual's actual value, productivity gain or return on investment.

The comparisons are decision-support tools, not financial advice or guarantees. Users should check the linked provider source and checkout terms before subscribing.

## Source handling

Every material source-backed record should include a canonical URL, publisher, retrieval date and notes about what the source does and does not establish. Price records preserve currency, region, billing period and observation date. API pricing records identify the model, per-million-token input/output rates, cache rates where published, tier labels and effective dates.

A historical observation should not be silently overwritten when a price changes. Close the previous record with an effective-to date and add a new observation with its own source and observation date. Prefer provider primary sources; third-party trackers are discovery aids, not evidence of record.

## Model catalogue and editorial groupings

The model catalogue is a curated snapshot of publicly announced model families and selected adjacent models, not an exhaustive list of every endpoint, checkpoint, modality-specific service or deployment alias. API model IDs and context windows are only recorded when verified.

The grouping labels—flagship, balanced, efficient, specialist and previous-generation—are editorial categories used to make the catalogue easier to explore. They are not provider-defined tiers, benchmark rankings or claims of equivalent capability. Preview and restricted availability must remain visible and must not be treated as general consumer access.
