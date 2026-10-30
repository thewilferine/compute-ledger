import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";
import rawCatalogue from "../public/data/catalogue.json";
import { datasetSchema } from "./data/schema";

describe("Compute Ledger app", () => {
  it("renders the dashboard and project navigation", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Compute Ledger");
    expect(html).toContain("What does AI really cost to serve?");
    expect(html).toContain("Providers");
    expect(html).toContain("Subscriptions");
    expect(html).toContain("Methodology");
  });

  it("validates the published catalogue and all source relationships", () => {
    const catalogue = datasetSchema.parse(rawCatalogue);
    const sourceIds = new Set(catalogue.sources.map((source) => source.id));
    const providerIds = new Set(catalogue.providers.map((provider) => provider.id));

    expect(catalogue.providers.length).toBeGreaterThan(0);
    expect(catalogue.models.length).toBeGreaterThan(0);
    expect(catalogue.subscriptionPlans.length).toBeGreaterThan(0);
    expect(catalogue.apiPricing.length).toBeGreaterThan(0);
    for (const provider of catalogue.providers) {
      for (const sourceId of provider.sources) expect(sourceIds.has(sourceId)).toBe(true);
    }
    for (const model of catalogue.models) {
      expect(providerIds.has(model.providerId)).toBe(true);
      for (const sourceId of model.sources) expect(sourceIds.has(sourceId)).toBe(true);
    }
    for (const price of catalogue.apiPricing) {
      expect(catalogue.models.some((model) => model.id === price.modelId)).toBe(true);
      expect(sourceIds.has(price.sourceId)).toBe(true);
      expect(price.inputPerMillion).toBeGreaterThanOrEqual(0);
      expect(price.outputPerMillion).toBeGreaterThanOrEqual(0);
    }
    for (const plan of catalogue.subscriptionPlans) {
      expect(providerIds.has(plan.providerId)).toBe(true);
      for (const sourceId of plan.sources) expect(sourceIds.has(sourceId)).toBe(true);
    }
  });

  it("renders an interactive inference calculator entry point", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Calculator");
  });
});
