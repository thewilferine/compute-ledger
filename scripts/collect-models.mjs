import { readFile } from "node:fs/promises";
import { fetchJsonObserved, writeJsonAtomic } from "./lib/refresh-io.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const knownProviders = {
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
  "x-ai": "xai",
  "z-ai": "zai",
  zai: "zai",
  nvidia: "nvidia",
};
const canonicalByApiId = new Map(
  catalogue.models.filter((model) => model.apiModelId).map((model) => [model.apiModelId.toLowerCase(), model.id]),
);

const source = {
  id: "openrouter-model-catalogue", url: "https://openrouter.ai/api/v1/models",
  publisher: "OpenRouter", domain: "models", strategy: "official-json-api",
  automationSuitability: "aggregator-discovery-review-required",
};
const fetched = await fetchJsonObserved(source);
if (fetched.status !== "fetched") {
  console.warn(`Model discovery source is ${fetched.status}; retaining the last-known-good candidate file. ${fetched.error}`);
  process.exit(0);
}
const payload = fetched.data;
if (!Array.isArray(payload.data) || payload.data.length === 0) {
  console.warn("Model discovery source returned an invalid/empty catalogue; retaining last-known-good candidates.");
  process.exit(0);
}

const observedAt = new Date().toISOString().slice(0, 10);
const candidates = payload.data.flatMap((model) => {
  if (typeof model.id !== "string" || typeof model.name !== "string") return [];
  const providerSlug = model.id.split("/")[0]?.toLowerCase();
  const providerId = knownProviders[providerSlug];
  if (!providerId) return [];

  const apiModelId = model.id.split("/").slice(1).join("/");
  return [{
    id: model.id,
    name: model.name,
    providerId,
    apiModelId,
    contextWindowTokens: Number.isInteger(model.context_length) ? model.context_length : null,
    inputModalities: model.architecture?.input_modalities ?? [],
    outputModalities: model.architecture?.output_modalities ?? [],
    createdAt: Number.isFinite(model.created) ? new Date(model.created * 1000).toISOString() : null,
    expirationDate: model.expiration_date ?? null,
    matchedCatalogueModelId: canonicalByApiId.get(apiModelId.toLowerCase()) ?? null,
    discoverySource: "OpenRouter model catalogue",
    sourceUrl: "https://openrouter.ai/api/v1/models",
    reviewRequired: true,
  }];
});

if (candidates.length === 0) throw new Error("No models from configured providers were found.");

await writeJsonAtomic("public/data/refresh-candidates/models.json", {
  schemaVersion: 1,
  observedAt,
  source: "OpenRouter public model catalogue",
  sourceUrl: "https://openrouter.ai/api/v1/models",
  limitations: [
    "OpenRouter is an aggregator, not the authoritative provider API catalogue.",
    "Presence does not prove direct API availability, regional availability or provider lifecycle status.",
    "New or changed model records require matching to an official provider source before entering catalogue.json.",
  ],
  candidates,
});
console.log(`Collected ${candidates.length} model discovery candidates from configured providers.`);
