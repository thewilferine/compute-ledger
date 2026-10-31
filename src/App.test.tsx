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
    expect(catalogue.models.length).toBeGreaterThanOrEqual(26);
    expect(catalogue.models.some((model) => model.id === "gpt-6-rosalind" && model.positioning === "specialist")).toBe(true);
    expect(catalogue.models.some((model) => model.id === "gemini-3-8-flash" && model.apiModelId === "gemini-3.8-flash")).toBe(true);
    expect(catalogue.models.some((model) => model.id === "glm-5-3-flash" && model.contextWindowTokens === 1048576)).toBe(true);
    expect(catalogue.models.some((model) => model.id === "muse-wonder")).toBe(true);
    expect(new Set(catalogue.models.map((model) => model.id)).size).toBe(catalogue.models.length);
    expect(catalogue.models.filter((model) => model.providerId === "deepseek" && model.name === "DeepSeek-V4.1-Flash-1017")).toHaveLength(1);
    expect(catalogue.apiPricing.length).toBeGreaterThanOrEqual(30);
    expect(catalogue.models.find((model) => model.id === "gpt-6-astra")?.apiModelId).toBe("gpt-6-astra");
    expect(catalogue.models.find((model) => model.id === "grok-4-7")?.contextWindowTokens).toBe(500000);
    expect(catalogue.models.find((model) => model.id === "deepseek-v4-pro")?.availability).toBe("current");
    expect(catalogue.apiPricing.find((price) => price.id === "openai-gpt-6-astra-standard")?.inputPerMillion).toBe(10);
    expect(catalogue.apiPricing.find((price) => price.id === "openai-gpt-6-astra-flex-batch")?.inputPerMillion).toBe(5);
    expect(catalogue.apiPricing.some((price) => price.effectiveFrom === "2026-12-01")).toBe(true);
    expect(catalogue.subscriptionPlans.length).toBeGreaterThanOrEqual(14);
    expect(catalogue.subscriptionPlans.some((plan) => plan.id === "claude-max-20x-usd" && plan.usageMultiplier === 20)).toBe(true);
    expect(catalogue.subscriptionPlans.some((plan) => plan.id === "google-ai-ultra-20x-gbp" && plan.currency === "GBP")).toBe(true);
    expect(catalogue.subscriptionPlans.some((plan) => plan.id === "xai-supergrok-usd" && plan.usageLimitType === "shared-pool")).toBe(true);
    expect(catalogue.subscriptionPlans.some((plan) => plan.id === "chatgpt-pro-500-usd")).toBe(true);
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
      if (plan.usageMultiplier !== undefined) expect(plan.usageMultiplier).toBeGreaterThan(0);
      expect(providerIds.has(plan.providerId)).toBe(true);
      for (const sourceId of plan.sources) expect(sourceIds.has(sourceId)).toBe(true);
    }
  });

  it("renders an interactive inference calculator entry point", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Calculator");
  });
});


describe("API list-price equivalent calculation", () => {
  it("prices uncached input, cached input and output separately", async () => {
    const { estimateApiEquivalent } = await import("./calculations/api-equivalent");
    const result = estimateApiEquivalent({
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      requestsPerMonth: 10,
      cachedInputShare: 0.5,
      inputPerMillion: 2,
      cachedInputPerMillion: 0.2,
      outputPerMillion: 10,
    });
    expect(result.totalInputTokens).toBe(10000);
    expect(result.cachedInputTokens).toBe(5000);
    expect(result.uncachedInputTokens).toBe(5000);
    expect(result.totalCost).toBeCloseTo(0.061);
    expect(result.usedPublishedCacheRate).toBe(true);
  });

  it("does not invent a cache discount when the provider publishes none", async () => {
    const { estimateApiEquivalent } = await import("./calculations/api-equivalent");
    const result = estimateApiEquivalent({
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 0,
      requestsPerMonth: 1,
      cachedInputShare: 0.5,
      inputPerMillion: 2,
      outputPerMillion: 10,
    });
    expect(result.totalCost).toBeCloseTo(0.002);
    expect(result.usedPublishedCacheRate).toBe(false);
  });

  it("rejects invalid cache shares", async () => {
    const { estimateApiEquivalent } = await import("./calculations/api-equivalent");
    expect(() => estimateApiEquivalent({
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      requestsPerMonth: 10,
      cachedInputShare: 1.2,
      inputPerMillion: 2,
      outputPerMillion: 10,
    })).toThrow("Cached input share must be between zero and one.");
  });
});
