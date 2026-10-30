import { describe, expect, it } from "vitest";
import { estimateInferenceCost } from "./inference-cost";

describe("estimateInferenceCost", () => {
  it("calculates allocated cost from explicit assumptions", () => {
    const result = estimateInferenceCost({
      acceleratorHourlyCost: 2,
      outputTokensPerSecond: 100,
      utilisation: 0.5,
      infrastructureOverheadMultiplier: 1.25,
      outputTokens: 9000,
    });

    expect(result.effectiveTokensPerSecond).toBe(50);
    expect(result.secondsRequired).toBe(180);
    expect(result.acceleratorCost).toBeCloseTo(0.1);
    expect(result.estimatedTotalCost).toBeCloseTo(0.125);
  });

  it("rejects utilisation outside the valid range", () => {
    expect(() => estimateInferenceCost({
      acceleratorHourlyCost: 2,
      outputTokensPerSecond: 100,
      utilisation: 1.1,
      infrastructureOverheadMultiplier: 1.2,
      outputTokens: 1000,
    })).toThrow(/utilisation/i);
  });
});
