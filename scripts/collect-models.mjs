import { readFile } from "node:fs/promises";
import { fetchJson, writeJsonAtomic } from "./lib/refresh-io.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const knownProviders = {
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
const canonicalByApiId = new Map(
  catalogue.models.filter((model) => model.apiModelId).map((model) => [model.apiModelId.toLowerCase(), model.id]),
);

const payload = await fetchJson("https://openrouter.ai/api/v1/models");
if (!Array.isArray(payload.data) || payload.data.length === 0) {
  throw new Error("OpenRouter model catalogue returned no models.");
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
