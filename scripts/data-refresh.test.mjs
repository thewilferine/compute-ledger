import { describe, expect, it } from "vitest";
import {
  formatRefreshSummary,
  REFRESH_DOMAINS,
  selectRefreshDomains,
  summarizeSourceHealth,
} from "./lib/data-refresh.mjs";

describe("data refresh pipeline", () => {
  it("selects all registered domains in a stable order", () => {
    expect(selectRefreshDomains("all")).toEqual([
      "exchange-rates",
      "subscriptions",
      "models",
      "api-pricing",
      "benchmarks",
    ]);
  });

  it("registers an automated collector and output for every domain", () => {
    expect(Object.values(REFRESH_DOMAINS).every((domain) => domain.status === "automated")).toBe(true);
    expect(Object.values(REFRESH_DOMAINS).every((domain) => domain.command?.length && domain.output?.length)).toBe(true);
  });

  it("selects an individual domain", () => {
    expect(selectRefreshDomains("api-pricing")).toEqual(["api-pricing"]);
  });

  it("rejects unknown domains", () => {
    expect(() => selectRefreshDomains("made-up")).toThrow(/unknown refresh domain/i);
  });


  it("reports mixed fetched, failed and manual-review sources as partial", () => {
    const summary = summarizeSourceHealth("subscriptions", [
      { domain: "subscriptions", status: "fetched" },
      { domain: "subscriptions", status: "blocked" },
      { domain: "subscriptions", status: "unavailable" },
      { domain: "subscriptions", status: "manual_review" },
    ]);

    expect(summary.status).toBe("Partial");
    expect(summary.counts).toEqual({
      total: 4, fetched: 1, failed: 2, manualReview: 1, other: 0,
    });
    expect(summary.details).toContain("1/4 sources fetched");
    expect(summary.details).toContain("1 blocked");
    expect(summary.details).toContain("1 unavailable");
    expect(summary.details).toContain("1 needs manual review");
  });

  it("does not call a domain with only manual-review sources fully fetched", () => {
    const summary = summarizeSourceHealth("api-pricing", [
      { domain: "api-pricing", status: "manual_review" },
    ]);

    expect(summary.status).toBe("Review required");
    expect(summary.details).toContain("0/1 sources fetched");
    expect(summary.details).toContain("1 needs manual review");
  });

  it("keeps a fully fetched domain successful even when values are unchanged", () => {
    const summary = summarizeSourceHealth("exchange-rates", [
      { domain: "exchange-rates", status: "fetched" },
    ]);

    expect(summary.status).toBe("Updated successfully");
    expect(summary.counts.fetched).toBe(1);
  });

  it("reports a domain with no registry entries rather than assuming success", () => {
    expect(summarizeSourceHealth("models", []).status).toBe("No source health data");
  });

  it("produces a readable report and escapes table separators", () => {
    const report = formatRefreshSummary([
      { label: "Rates", status: "Updated", details: "Source | ECB" },
    ]);
    expect(report).toContain("| Rates | Updated | Source \\| ECB |");
    expect(report).toContain("Candidate observations remain separate from canonical catalogue records until reviewed.");
  });
});
