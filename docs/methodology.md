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

This is deliberately a small building block, not a complete inference cost model. It does not yet account for prompt/prefill tokens, batching interactions, KV cache, model parallelism, quantisation, accelerator memory, multi-GPU topology, speculative decoding, multimodal processing, idle capacity allocation, or provider-specific fleet scheduling.

## Revenue and subsidy caveats

A consumer subscription price is not equivalent to revenue available for inference. Plans may include multiple products, have variable usage, discounts, taxes, app-store fees, and cross-subsidies. Actual per-user revenue allocation and serving cost are generally not public.

Any later comparison must therefore be labelled as an illustrative scenario, not a measured loss or profit.

## Source handling

Every material source-backed record should include a canonical URL, publisher, retrieval date, and notes about what the source does and does not establish. Price records must include currency, region, billing period, and observation date. Material changes should be reviewed before publication.
