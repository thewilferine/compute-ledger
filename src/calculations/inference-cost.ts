/**
 * Transparent illustrative cost model.
 * This is not a claim about any provider's actual internal serving costs.
 */
export interface InferenceCostInputs {
  /** Effective accelerator cost in the selected currency per hour. */
  acceleratorHourlyCost: number;
  /** Sustained aggregate output throughput for the serving allocation. */
  outputTokensPerSecond: number;
  /** Productive utilisation fraction, from greater than zero to one. */
  utilisation: number;
  /** Multiplier for host, memory, networking, redundancy and other overhead. */
  infrastructureOverheadMultiplier: number;
  outputTokens: number;
}

export interface InferenceCostResult {
  effectiveTokensPerSecond: number;
  secondsRequired: number;
  acceleratorCost: number;
  estimatedTotalCost: number;
}

export function estimateInferenceCost(input: InferenceCostInputs): InferenceCostResult {
  if (Object.values(input).some((value) => !Number.isFinite(value))) {
    throw new Error("All inference cost inputs must be finite numbers.");
  }
  if (input.acceleratorHourlyCost < 0 || input.outputTokens < 0) {
    throw new Error("Costs and token counts cannot be negative.");
  }
  if (input.outputTokensPerSecond <= 0) {
    throw new Error("Output throughput must be greater than zero.");
  }
  if (input.utilisation <= 0 || input.utilisation > 1) {
    throw new Error("Utilisation must be greater than zero and at most one.");
  }
  if (input.infrastructureOverheadMultiplier < 1) {
    throw new Error("Infrastructure overhead multiplier must be at least one.");
  }

  const effectiveTokensPerSecond = input.outputTokensPerSecond * input.utilisation;
  const secondsRequired = input.outputTokens / effectiveTokensPerSecond;
  const acceleratorCost = (secondsRequired / 3600) * input.acceleratorHourlyCost;

  return {
    effectiveTokensPerSecond,
    secondsRequired,
    acceleratorCost,
    estimatedTotalCost: acceleratorCost * input.infrastructureOverheadMultiplier,
  };
}
