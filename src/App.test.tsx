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

    expect(catalogue.providers.length).toBeGreaterThanOrEqual(10);
    expect(catalogue.providers.some((provider) => provider.id === "meta")).toBe(true);
    expect(catalogue.providers.some((provider) => provider.id === "moonshot")).toBe(true);
    expect(catalogue.providers.some((provider) => provider.id === "zai")).toBe(true);
    expect(catalogue.models.length).toBeGreaterThanOrEqual(20);
    expect(catalogue.apiPricing.length).toBeGreaterThanOrEqual(30);
    expect(catalogue.models.find((model) => model.id === "gpt-6-astra")?.apiModelId).toBe("gpt-6-astra");
    expect(catalogue.models.find((model) => model.id === "grok-4-7")?.contextWindowTokens).toBe(500000);
    expect(catalogue.models.find((model) => model.id === "deepseek-v4-pro")?.availability).toBe("current");
    expect(catalogue.apiPricing.find((price) => price.id === "openai-gpt-6-astra-standard")?.inputPerMillion).toBe(10);
    expect(catalogue.apiPricing.find((price) => price.id === "openai-gpt-6-astra-flex-batch")?.inputPerMillion).toBe(5);
    expect(catalogue.apiPricing.some((price) => price.effectiveFrom === "2026-12-01")).toBe(true);
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
      if (price.cachedInputPerMillion !== undefined) expect(price.cachedInputPerMillion).toBeGreaterThanOrEqual(0);
      if (price.cacheWrite5mPerMillion !== undefined) expect(price.cacheWrite5mPerMillion).toBeGreaterThanOrEqual(0);
      if (price.cacheWrite1hPerMillion !== undefined) expect(price.cacheWrite1hPerMillion).toBeGreaterThanOrEqual(0);
      if (price.effectiveFrom && price.effectiveTo) expect(price.effectiveFrom <= price.effectiveTo).toBe(true);
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
