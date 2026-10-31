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
    cadence: "Weekly source observation",
    status: "automated",
    command: ["scripts/collect-subscriptions.mjs"],
    output: ["public/data/refresh-candidates/subscriptions.json"],
    source: "Official provider subscription and help pages",
  },
  models: {
    label: "Model catalogue",
    cadence: "Weekly discovery refresh",
    status: "automated",
    command: ["scripts/collect-models.mjs"],
    output: ["public/data/refresh-candidates/models.json"],
    source: "OpenRouter public model catalogue (discovery only)",
  },
  "api-pricing": {
    label: "API pricing",
    cadence: "Weekly source observation",
    status: "automated",
    command: ["scripts/collect-api-pricing.mjs"],
    output: ["public/data/refresh-candidates/api-pricing.json"],
    source: "Official provider pricing pages and OpenRouter routed rates",
  },
  benchmarks: {
    label: "Independent benchmarks",
    cadence: "Weekly leaderboard refresh",
    status: "automated",
    command: ["scripts/collect-benchmarks.mjs"],
    output: ["public/data/benchmarks.json"],
    source: "Hugging Face public leaderboard API for SWE-bench Verified and GSM8K",
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
