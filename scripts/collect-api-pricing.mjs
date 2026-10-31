import { readFile } from "node:fs/promises";
import {
  extractPriceMentions,
  fetchJson,
  fetchPage,
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
    officialSources.push({
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
  const { body, contentType } = await fetchPage(source.url);
  const text = htmlToText(body);
  officialSources.push({
    sourceId,
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
const payload = await fetchJson("https://openrouter.ai/api/v1/models");
if (!Array.isArray(payload.data) || payload.data.length === 0) {
  throw new Error("OpenRouter pricing catalogue returned no models.");
}
const providerMap = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
  deepseek: "deepseek",
  xai: "xai",
  meta: "meta",
  mistral: "mistral",
  qwen: "alibaba",
  moonshotai: "moonshot",
  zai: "zai",
  nvidia: "nvidia",
};
const aggregatorQuotes = payload.data.flatMap((model) => {
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

if (officialSources.length === 0 || aggregatorQuotes.length === 0) {
  throw new Error("API pricing collector returned incomplete source coverage.");
}

await writeJsonAtomic("public/data/refresh-candidates/api-pricing.json", {
  schemaVersion: 1,
  observedAt,
  officialSources,
  aggregatorQuotes,
  limitations: [
    "Official source price mentions are evidence only and are not automatically mapped to catalogue pricing records.",
    "OpenRouter rates are aggregator-specific and must not be presented as direct provider list prices.",
    "All rates are retained as USD per million tokens only where the source provides per-token prompt/completion rates.",
  ],
});
console.log(`Captured ${officialSources.length} official pricing pages and ${aggregatorQuotes.length} aggregator price observations.`);
