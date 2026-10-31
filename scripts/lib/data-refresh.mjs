export const REFRESH_DOMAINS = {
  "exchange-rates": {
    label: "Exchange rates",
    cadence: "Weekdays",
    status: "automated",
    command: ["scripts/update-exchange-rates.mjs"],
    output: ["public/data/exchange-rates.json"],
    source: "European Central Bank reference rates via Frankfurter",
  },
  subscriptions: {
    label: "Consumer subscriptions",
    cadence: "Manual review until reliable source adapters exist",
    status: "manual-review",
    reason: "Regional prices, promotions and usage terms are not consistently available as machine-readable data.",
  },
  models: {
    label: "Model catalogue",
    cadence: "Manual review until reliable source adapters exist",
    status: "manual-review",
    reason: "Provider model directories and lifecycle announcements require source-specific interpretation.",
  },
  "api-pricing": {
    label: "API pricing",
    cadence: "Manual review until reliable source adapters exist",
    status: "manual-review",
    reason: "Pricing pages vary by modality, tier, cache policy, region and effective date.",
  },
  benchmarks: {
    label: "Independent benchmarks",
    cadence: "Manual review",
    status: "manual-review",
    reason: "Benchmark results need provenance, methodology and licensing review before inclusion.",
  },
};

export function selectRefreshDomains(selection = "all") {
  if (selection === "all") return Object.keys(REFRESH_DOMAINS);
  if (!Object.hasOwn(REFRESH_DOMAINS, selection)) {
    throw new Error(`Unknown refresh domain "${selection}".`);
  }
  return [selection];
}

export function formatRefreshSummary(results) {
  const lines = [
    "## Data refresh report",
    "",
    "| Domain | Result | Details |",
    "| --- | --- | --- |",
  ];

  for (const result of results) {
    lines.push(`| ${result.label} | ${result.status} | ${result.details.replaceAll("|", "\\|")} |`);
  }

  lines.push(
    "",
    "Automated collectors only update data after successful retrieval and validation. Manual-review domains are intentionally left unchanged.",
  );
  return lines.join("\n");
}
