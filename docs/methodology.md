# Initial methodology and modelling boundaries

## What the project estimates

The Compute Ledger aims to estimate the serving resources plausibly required by workloads and compare those estimates with publicly advertised consumer plan prices. It is an independent model, not a view into a provider's accounts.

## Important distinctions

- **Published fact:** a price, plan limit, model specification, or other detail stated by a primary source.
- **External estimate:** a third-party estimate with its own methodology and limitations.
- **Modelling assumption:** an input selected to explore a scenario, such as accelerator hourly cost or effective throughput.
- **Calculated estimate:** an output produced from documented inputs and a deterministic formula.

These categories must remain distinguishable in the UI and data model.

## Initial inference-cost calculation

The first calculator expresses an illustrative output-token workload as an allocated accelerator cost:

- Effective throughput = sustained throughput × utilisation
- Serving seconds = output tokens ÷ effective throughput
- Accelerator cost = (serving seconds ÷ 3,600) × accelerator hourly cost
- Estimated total = accelerator cost × infrastructure overhead multiplier

This is deliberately a small building block, not a complete inference cost model. The calculator's hourly accelerator allocation, throughput, utilisation and overhead are user-editable assumptions; the default values are illustrative rather than sourced provider disclosures. It does not yet account for prompt/prefill tokens, batching interactions, KV cache, model parallelism, quantisation, accelerator memory, multi-GPU topology, speculative decoding, multimodal processing, idle capacity allocation, or provider-specific fleet scheduling.

## Revenue and subsidy caveats

A consumer subscription price is not equivalent to revenue available for inference. API list prices are also not internal serving costs: they include commercial pricing decisions and may reflect margins, discounts, product strategy and other factors. They can be used as a customer-facing benchmark, but not as a proxy for GPU cost. Plans may include multiple products, have variable usage, discounts, taxes, app-store fees, and cross-subsidies. Actual per-user revenue allocation and serving cost are generally not public.

Any later comparison must therefore be labelled as an illustrative scenario, not a measured loss or profit. A defensible subscriber-level estimate needs workload telemetry (input/output/cache tokens and model mix), regional plan revenue net of taxes and platform fees, and realistic allocated infrastructure costs. Public data alone cannot establish that an individual subscriber is loss-making.

## Source handling

Every material source-backed record should include a canonical URL, publisher, retrieval date, and notes about what the source does and does not establish. API pricing records also identify the model, currency, per-million-token input/output rates, cached-input rate where published, and any rate tier such as peak/off-peak. Price records must include currency, region, billing period, and observation date. Material changes should be reviewed before publication.


## Provider and model coverage

The model catalogue is a curated snapshot of major frontier model families, not an exhaustive list of every release, deployment alias or specialist model. A provider can be included even when its API pricing, consumer plan or detailed specifications have not yet been verified. Model status distinguishes current releases, public previews, previous-generation entries and retired models. Historical price rows remain visible with notes where a model has been superseded. Coverage should be refreshed against primary provider announcements and pricing documentation; third-party model trackers are discovery aids, not evidence of record.


## Expanded API price observations

API price records represent a specific published tier and effective period. The model stores standard input/output rates, cached-input read rates, cache-write rates where published, tier labels, observation dates and effective dates. It keeps separate rows for batch, speed, long-context and peak/off-peak rates rather than collapsing them into a single blended number. Future-dated rates are stored before they become effective and must not be treated as current prices.

For Anthropic, cache writes, cache reads, batch discounts and data-residency multipliers can stack. For xAI, long-context rates apply to all prompt tokens once the request crosses the published threshold. For Google, introductory prices can have a scheduled end date. For DeepSeek, peak and off-peak periods are provider-defined UTC windows. These modifiers should be applied only when the workload and endpoint meet the provider's published conditions.

A historical observation is never overwritten when a rate changes. The previous record should be closed with an effective-to date and a new observation added with its own source and observation date. API list prices remain commercial prices, not estimates of internal serving cost.


## Consumer subscription observations

Subscription records are retail price observations, not recognised revenue or inference budgets. Each observation preserves the advertised currency, region, billing period and date. An annual plan records the amount billed for the year; any monthly equivalent is a simple division by twelve and does not imply monthly billing. Regional taxes, app-store pricing, promotions and exchange rates can change the checkout amount.

Usage policy is recorded separately from price and model access. The catalogue distinguishes dynamic limits, published relative tier multipliers, shared usage pools and cases where a limit has not been published. A multiplier such as 5× Pro is not a token quota. A shared pool is not a count of equivalent requests: compute-intensive features can consume more capacity than simple chat. Where a provider does not publish a fixed allowance, the project must not invent one. Model access summaries are deliberately high-level and retain provider caveats about availability, rollout and account-specific eligibility.

The current subscription snapshot covers selected individual plans from OpenAI, Anthropic, Google and xAI. It is not a complete list of every region, promotion, legacy plan or consumer AI service. Prices and policies should be rechecked against the linked primary source before being used in a current commercial comparison.
