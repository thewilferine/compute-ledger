import { createHash } from "node:crypto";

export const COLLECTIONS = [
  "sources",
  "providers",
  "models",
  "subscriptionPlans",
  "apiPricing",
];

const VOLATILE_FIELDS = new Set(["updatedAt", "accessedAt", "observedAt"]);

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function hashCatalogue(catalogue) {
  return createHash("sha256").update(stableStringify(catalogue)).digest("hex");
}

function comparableValue(value) {
  if (Array.isArray(value)) return value.map(comparableValue).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => !VOLATILE_FIELDS.has(key))
        .sort()
        .map((key) => [key, comparableValue(value[key])]),
    );
  }
  return value;
}

function collectFieldChanges(before, after, prefix = "") {
  const left = comparableValue(before);
  const right = comparableValue(after);
  if (JSON.stringify(left) === JSON.stringify(right)) return [];

  if (
    left && right &&
    typeof left === "object" && typeof right === "object" &&
    !Array.isArray(left) && !Array.isArray(right)
  ) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    return keys.flatMap((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (!(key in left)) return [{ path, before: null, after: right[key] }];
      if (!(key in right)) return [{ path, before: left[key], after: null }];
      return collectFieldChanges(left[key], right[key], path);
    });
  }

  return [{ path: prefix || "$", before: left, after: right }];
}

function indexById(records, collection) {
  const result = new Map();
  for (const record of records ?? []) {
    if (!record || typeof record.id !== "string" || !record.id.trim()) {
      throw new Error(`Every record in ${collection} must have a non-empty string id.`);
    }
    if (result.has(record.id)) throw new Error(`Duplicate id "${record.id}" in ${collection}.`);
    result.set(record.id, record);
  }
  return result;
}

export function validateCatalogueRelationships(catalogue) {
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(catalogue[collection])) {
      throw new Error(`Catalogue collection "${collection}" must be an array.`);
    }
    indexById(catalogue[collection], collection);
  }

  const sourceIds = new Set(catalogue.sources.map((item) => item.id));
  const providerIds = new Set(catalogue.providers.map((item) => item.id));
  const modelIds = new Set(catalogue.models.map((item) => item.id));

  for (const provider of catalogue.providers) {
    for (const sourceId of provider.sources ?? []) {
      if (!sourceIds.has(sourceId)) throw new Error(`Provider "${provider.id}" references missing source "${sourceId}".`);
    }
  }
  for (const model of catalogue.models) {
    if (!providerIds.has(model.providerId)) throw new Error(`Model "${model.id}" references missing provider "${model.providerId}".`);
    for (const sourceId of model.sources ?? []) {
      if (!sourceIds.has(sourceId)) throw new Error(`Model "${model.id}" references missing source "${sourceId}".`);
    }
  }
  for (const plan of catalogue.subscriptionPlans) {
    if (!providerIds.has(plan.providerId)) throw new Error(`Subscription plan "${plan.id}" references missing provider "${plan.providerId}".`);
    for (const sourceId of plan.sources ?? []) {
      if (!sourceIds.has(sourceId)) throw new Error(`Subscription plan "${plan.id}" references missing source "${sourceId}".`);
    }
  }
  for (const price of catalogue.apiPricing) {
    if (!modelIds.has(price.modelId)) throw new Error(`API price "${price.id}" references missing model "${price.modelId}".`);
    if (!sourceIds.has(price.sourceId)) throw new Error(`API price "${price.id}" references missing source "${price.sourceId}".`);
  }

  return catalogue;
}

export function createChangeSet(previous, current) {
  if (!previous) return [];
  const changes = [];

  for (const collection of COLLECTIONS) {
    const before = indexById(previous?.[collection] ?? [], collection);
    const after = indexById(current?.[collection] ?? [], collection);
    const ids = [...new Set([...before.keys(), ...after.keys()])].sort();

    for (const id of ids) {
      const oldRecord = before.get(id);
      const newRecord = after.get(id);
      if (!oldRecord) {
        changes.push({ collection, recordId: id, type: "added", after: newRecord });
      } else if (!newRecord) {
        changes.push({ collection, recordId: id, type: "removed", before: oldRecord });
      } else {
        const fields = collectFieldChanges(oldRecord, newRecord);
        if (fields.length) {
          changes.push({
            collection,
            recordId: id,
            type: "updated",
            label: newRecord.name ?? newRecord.title ?? id,
            fields,
          });
        }
      }
    }
  }

  return changes.sort((a, b) =>
    a.collection.localeCompare(b.collection) ||
    a.recordId.localeCompare(b.recordId) ||
    a.type.localeCompare(b.type),
  );
}
