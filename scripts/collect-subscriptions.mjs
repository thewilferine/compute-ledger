import { readFile } from "node:fs/promises";
import {
  classifySourceError,
  extractPriceMentions,
  fetchPageObserved,
  htmlToText,
  writeJsonAtomic,
} from "./lib/refresh-io.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const sourceById = new Map(catalogue.sources.map((source) => [source.id, source]));
const planIdsBySource = new Map();

for (const plan of catalogue.subscriptionPlans) {
  for (const sourceId of plan.sources) {
    const ids = planIdsBySource.get(sourceId) ?? [];
    ids.push(plan.id);
    planIdsBySource.set(sourceId, ids);
  }
}

const observedAt = new Date().toISOString().slice(0, 10);
const previousOutput = await readFile("public/data/refresh-candidates/subscriptions.json", "utf8")
  .then((value) => JSON.parse(value))
  .catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
const previousBySourceId = new Map((previousOutput?.observations ?? []).map((item) => [item.sourceId, item]));
const observations = [];

for (const [sourceId, linkedPlanIds] of planIdsBySource) {
  const source = sourceById.get(sourceId);
  if (!source) throw new Error(`Subscription source "${sourceId}" is missing from the catalogue.`);

  const baseObservation = {
    sourceId,
    title: source.title,
    publisher: source.publisher,
    sourceUrl: source.url,
    observedAt,
    linkedPlanIds: [...new Set(linkedPlanIds)],
    reviewRequired: true,
  };

  try {
    const result = await fetchPageObserved({
      id: sourceId, url: source.url, publisher: source.publisher,
      domain: "subscriptions", strategy: "official-html-page",
      automationSuitability: "human-review-required",
    });
    if (result.status !== "fetched") throw new Error(result.error);
    const { body, contentType } = result;
    const text = htmlToText(body);
    const mentions = extractPriceMentions(text);

    observations.push({
      ...baseObservation,
      status: "fetched",
      contentType,
      pageCharacters: body.length,
      priceMentions: mentions,
      reviewReason: "Page text is evidence for human review only; price mentions are not assigned to plans, regions or billing periods automatically.",
    });
    console.log(`Fetched subscription source ${sourceId} (${source.url}).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    observations.push({
      ...baseObservation,
      status: classifySourceError(error),
      contentType: null,
      pageCharacters: null,
      priceMentions: [],
      error: message,
      lastKnownGoodObservation: previousBySourceId.get(sourceId) ? {
        observedAt: previousBySourceId.get(sourceId).observedAt,
        contentType: previousBySourceId.get(sourceId).contentType,
        pageCharacters: previousBySourceId.get(sourceId).pageCharacters,
        priceMentions: previousBySourceId.get(sourceId).priceMentions,
      } : null,
      reviewReason: "Source could not be retrieved. No pricing conclusions can be drawn; the last successful observation is retained separately for context.",
    });
    console.warn(`Unable to fetch subscription source ${sourceId}: ${message}`);
  }
}

if (observations.length === 0) {
  throw new Error("No subscription source pages were configured; refusing to write an empty observation set.");
}

await writeJsonAtomic("public/data/refresh-candidates/subscriptions.json", {
  schemaVersion: 1,
  observedAt,
  source: "Official provider subscription and help pages",
  observations,
});
const fetched = observations.filter((item) => item.status === "fetched").length;
const unavailable = observations.length - fetched;
console.log(`Collected ${observations.length} subscription source observations: ${fetched} fetched, ${unavailable} unavailable. Canonical plan records were not changed.`);
