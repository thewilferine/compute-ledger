import { readFile } from "node:fs/promises";
import {
  extractPriceMentions,
  fetchPage,
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
const observations = [];

for (const [sourceId, linkedPlanIds] of planIdsBySource) {
  const source = sourceById.get(sourceId);
  if (!source) throw new Error(`Subscription source "${sourceId}" is missing from the catalogue.`);

  const { body, contentType } = await fetchPage(source.url);
  const text = htmlToText(body);
  const mentions = extractPriceMentions(text);

  observations.push({
    sourceId,
    title: source.title,
    publisher: source.publisher,
    sourceUrl: source.url,
    observedAt,
    linkedPlanIds: [...new Set(linkedPlanIds)],
    contentType,
    pageCharacters: body.length,
    priceMentions: mentions,
    reviewRequired: true,
    reviewReason: "Page text is evidence for human review only; price mentions are not assigned to plans, regions or billing periods automatically.",
  });
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
console.log(`Collected ${observations.length} subscription source observations; canonical plan records were not changed.`);
