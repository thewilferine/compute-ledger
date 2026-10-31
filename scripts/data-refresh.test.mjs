import { describe, expect, it } from "vitest";
import {
  formatRefreshSummary,
  selectRefreshDomains,
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

  it("selects an individual domain", () => {
    expect(selectRefreshDomains("api-pricing")).toEqual(["api-pricing"]);
  });

  it("rejects unknown domains", () => {
    expect(() => selectRefreshDomains("made-up")).toThrow(/unknown refresh domain/i);
  });

  it("produces a readable report and escapes table separators", () => {
    const report = formatRefreshSummary([
      { label: "Rates", status: "Updated", details: "Source | ECB" },
    ]);
    expect(report).toContain("| Rates | Updated | Source \\| ECB |");
    expect(report).toContain("Manual-review domains are intentionally left unchanged.");
  });
});
