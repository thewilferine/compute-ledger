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


const SOURCE_FAILURE_STATUSES = [
  "blocked",
  "rate_limited",
  "transient_failure",
  "unavailable",
  "invalid_response",
];

export function summarizeSourceHealth(domain, sources = []) {
  const domainSources = sources.filter((source) => source.domain === domain);
  const total = domainSources.length;
  if (total === 0) {
    return {
      status: "No source health data",
      details: "No source registry entries were found for this domain.",
      counts: { total: 0, fetched: 0, failed: 0, manualReview: 0, other: 0 },
      failures: {},
    };
  }

  const fetched = domainSources.filter((source) => source.status === "fetched").length;
  const manualReview = domainSources.filter((source) => source.status === "manual_review").length;
  const failures = Object.fromEntries(SOURCE_FAILURE_STATUSES.map((status) => [
    status,
    domainSources.filter((source) => source.status === status).length,
  ]).filter(([, count]) => count > 0));
  const failed = Object.values(failures).reduce((sum, count) => sum + count, 0);
  const other = total - fetched - manualReview - failed;

  const details = [
    `${fetched}/${total} sources fetched`,
    ...Object.entries(failures).map(([status, count]) => `${count} ${status.replaceAll("_", " ")}`),
    ...(other ? [`${other} with unrecognised status`] : []),
    ...(manualReview ? [`${manualReview} needs manual review`] : []),
  ].join("; ") + ".";

  let status;
  if (failed > 0 || other > 0) status = fetched > 0 || manualReview > 0 ? "Partial" : "Source failures";
  else if (manualReview > 0) status = "Review required";
  else if (fetched === total) status = "Updated successfully";
  else status = "Incomplete";

  return {
    status,
    details,
    counts: { total, fetched, failed, manualReview, other },
    failures,
  };
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
    "Collectors only write after successful retrieval and validation. Candidate observations remain separate from canonical catalogue records until reviewed.",
  );
  return lines.join("\n");
}
