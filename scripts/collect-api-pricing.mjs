import { readFile } from "node:fs/promises";
import {
  extractPriceMentions,
  fetchJsonObserved,
  fetchPageObserved,
  recordSourceHealth,
  htmlToText,
  writeJsonAtomic,
} from "./lib/refresh-io.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const sourceById = new Map(catalogue.sources.map((source) => [source.id, source]));
const pricingSourceIds = [...new Set(catalogue.apiPricing.map((price) => price.sourceId))];
const observedAt = new Date().toISOString().slice(0, 10);

// Capture the official pricing documentation as source evidence. Generic
// currency extraction is deliberately not treated as a model/price mapping.
const officialSources = [];
for (const sourceId of pricingSourceIds) {
  const source = sourceById.get(sourceId);
  if (!source) throw new Error(`API pricing source "${sourceId}" is missing from the catalogue.`);
  if (source.url.toLowerCase().endsWith(".pdf")) {
    await recordManualSource({
      id: sourceId, url: source.url, publisher: source.publisher,
      domain: "api-pricing", strategy: "pdf-manual-review",
      automationSuitability: "manual-review",
    });
    officialSources.push({
      status: "manual_review",
      sourceId,
      title: source.title,
      publisher: source.publisher,
      sourceUrl: source.url,
      observedAt,
      contentType: "application/pdf",
      pageCharacters: null,
      priceMentions: [],
      reviewRequired: true,
      reviewReason: "PDF pricing source retained for human review; automated text extraction is not enabled for binary documents.",
    });
    continue;
  }
  const fetched = await fetchPageObserved({
    id: sourceId, url: source.url, publisher: source.publisher,
    domain: "api-pricing", strategy: "official-html-page",
    automationSuitability: "human-review-required",
  });
  if (fetched.status !== "fetched") {
    officialSources.push({
      sourceId, title: source.title, publisher: source.publisher,
      sourceUrl: source.url, observedAt, status: fetched.status,
      contentType: null, pageCharacters: null, priceMentions: [],
      error: fetched.error, reviewRequired: true,
      reviewReason: "Source retrieval failed. No pricing conclusions can be drawn; existing catalogue values remain unchanged.",
    });
    continue;
  }
  const { body, contentType } = fetched;
  const text = htmlToText(body);
  officialSources.push({
    sourceId,
    status: "fetched",
    title: source.title,
    publisher: source.publisher,
    sourceUrl: source.url,
    observedAt,
    contentType,
    pageCharacters: body.length,
    priceMentions: extractPriceMentions(text),
    reviewRequired: true,
    reviewReason: "Extracted currency values are not safely attributable to model, modality, tier, token unit or effective date without provider-specific interpretation.",
  });
}

// OpenRouter's public catalogue provides machine-readable per-model rates.
// Keep these in a separate dataset: aggregator rates are not provider list prices.
const previousOutput = await readFile("public/data/refresh-candidates/api-pricing.json", "utf8")
  .then((value) => JSON.parse(value))
  .catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
const aggregatorSource = {
  id: "openrouter-model-pricing", url: "https://openrouter.ai/api/v1/models",
  publisher: "OpenRouter", domain: "api-pricing", strategy: "official-json-api",
  automationSuitability: "aggregator-data-review-required",
};
const aggregatorResult = await fetchJsonObserved(aggregatorSource);
const payload = aggregatorResult.status === "fetched" ? aggregatorResult.data : null;
const aggregatorValid = Array.isArray(payload?.data) && payload.data.length > 0;
if (aggregatorResult.status === "fetched" && !aggregatorValid) {
  await recordSourceHealth({
    ...aggregatorSource, status: "invalid_response",
    error: "OpenRouter response did not contain a non-empty data array.",
  });
}

const providerMap = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
  deepseek: "deepseek",
  xai: "xai",
  "x-ai": "xai",
  meta: "meta",
  "meta-llama": "meta",
  mistral: "mistral",
  mistralai: "mistral",
  qwen: "alibaba",
  moonshotai: "moonshot",
  "moonshot-ai": "moonshot",
  zai: "zai",
  "z-ai": "zai",
  nvidia: "nvidia",
};
const aggregatorQuotes = payload?.data?.flatMap((model) => {
  const providerSlug = model.id?.split("/")[0]?.toLowerCase();
  const providerId = providerMap[providerSlug];
  const input = Number(model.pricing?.prompt);
  const output = Number(model.pricing?.completion);
  if (!providerId || !Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) return [];
  return [{
    modelId: model.id,
    modelName: model.name,
    providerId,
    currency: "USD",
    inputPerMillion: input * 1_000_000,
    outputPerMillion: output * 1_000_000,
    cachedInputPerMillion: Number.isFinite(Number(model.pricing?.input_cache_read))
      ? Number(model.pricing.input_cache_read) * 1_000_000
      : null,
    priceUnit: "per million tokens",
    tier: "OpenRouter routed rate",
    sourceUrl: "https://openrouter.ai/api/v1/models",
    observedAt,
    reviewRequired: true,
  }];
});

const retainedAggregatorQuotes = aggregatorValid
  ? aggregatorQuotes
  : (previousOutput?.aggregatorQuotes ?? []);

await writeJsonAtomic("public/data/refresh-candidates/api-pricing.json", {
  schemaVersion: 1,
  observedAt,
  officialSources,
  aggregatorQuotes: retainedAggregatorQuotes,
  aggregatorStatus: aggregatorValid ? "fetched" : (aggregatorResult.status === "fetched" ? "invalid_response" : aggregatorResult.status),
  aggregatorError: aggregatorResult.error ?? (aggregatorValid ? null : "OpenRouter response did not contain a non-empty data array."),
  limitations: [
    "Official source price mentions are evidence only and are not automatically mapped to catalogue pricing records.",
    "OpenRouter rates are aggregator-specific and must not be presented as direct provider list prices.",
    "All rates are retained as USD per million tokens only where the source provides per-token prompt/completion rates.",
  ],
});
const fetchedPages = officialSources.filter((source) => source.status === "fetched").length;
const unavailablePages = officialSources.length - fetchedPages;
console.log(`Captured ${fetchedPages}/${officialSources.length} official pricing pages; ${unavailablePages} need review. OpenRouter status: ${aggregatorResult.status}; ${retainedAggregatorQuotes.length} aggregator observations retained.`);
