import { describe, expect, it } from "vitest";
import {
  createChangeSet,
  hashCatalogue,
  stableStringify,
  validateCatalogueRelationships,
} from "./lib/catalogue-history.mjs";

const catalogue = () => ({
  schemaVersion: 1,
  updatedAt: "2026-10-30T12:00:00.000Z",
  sources: [{ id: "source-a", title: "Source A", accessedAt: "2026-10-30" }],
  providers: [{ id: "provider-a", sources: ["source-a"] }],
  models: [{ id: "model-a", providerId: "provider-a", sources: ["source-a"], name: "Model A" }],
  subscriptionPlans: [{ id: "plan-a", providerId: "provider-a", sources: ["source-a"], name: "Plan A", price: 10, observedAt: "2026-10-30" }],
  apiPricing: [{ id: "price-a", modelId: "model-a", sourceId: "source-a", inputPerMillion: 1, outputPerMillion: 2, observedAt: "2026-10-30" }],
});

describe("catalogue history helpers", () => {
  it("serialises object keys and unordered arrays deterministically", () => {
    expect(stableStringify({ b: 2, a: 1, tags: ["z", "a"] }))
      .toBe(stableStringify({ tags: ["a", "z"], a: 1, b: 2 }));
    expect(hashCatalogue({ b: 2, a: 1 })).toBe(hashCatalogue({ a: 1, b: 2 }));
  });

  it("validates catalogue relationships and rejects broken references", () => {
    expect(() => validateCatalogueRelationships(catalogue())).not.toThrow();
    const invalid = catalogue();
    invalid.models[0].providerId = "missing-provider";
    expect(() => validateCatalogueRelationships(invalid)).toThrow(/missing provider/i);
  });

  it("rejects duplicate identifiers in a collection", () => {
    const invalid = catalogue();
    invalid.models.push({ ...invalid.models[0] });
    expect(() => validateCatalogueRelationships(invalid)).toThrow(/duplicate id/i);
  });

  it("records additions, removals and field-level updates in a stable order", () => {
    const before = catalogue();
    const after = catalogue();
    after.models[0].name = "Model A2";
    after.models.push({ id: "model-b", providerId: "provider-a", sources: ["source-a"], name: "Model B" });
    after.subscriptionPlans = [];

    expect(createChangeSet(before, after)).toEqual([
      {
        collection: "models",
        recordId: "model-a",
        type: "updated",
        label: "Model A2",
        fields: [{ path: "name", before: "Model A", after: "Model A2" }],
      },
      {
        collection: "models",
        recordId: "model-b",
        type: "added",
        after: { id: "model-b", providerId: "provider-a", sources: ["source-a"], name: "Model B" },
      },
      {
        collection: "subscriptionPlans",
        recordId: "plan-a",
        type: "removed",
        before: before.subscriptionPlans[0],
      },
    ]);
  });

  it("does not report timestamp-only refreshes or array ordering as substantive changes", () => {
    const before = catalogue();
    const after = catalogue();
    after.updatedAt = "2026-10-31T12:00:00.000Z";
    after.sources[0].accessedAt = "2026-10-31";
    after.subscriptionPlans[0].observedAt = "2026-10-31";
    after.providers[0].sources.reverse();
    expect(createChangeSet(before, after)).toEqual([]);
  });

  it("reports meaningful price and entitlement changes", () => {
    const before = catalogue();
    const after = catalogue();
    after.subscriptionPlans[0].price = 15;
    after.subscriptionPlans[0].usageLimitSummary = "Higher allowance";
    const changes = createChangeSet(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].fields).toEqual([
      { path: "price", before: 10, after: 15 },
      { path: "usageLimitSummary", before: null, after: "Higher allowance" },
    ]);
  });
});
