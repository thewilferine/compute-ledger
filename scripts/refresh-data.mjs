import { readFileSync } from "node:fs";
import { appendFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { datasetSchema } from "../src/data/schema.ts";
import { validateCatalogueRelationships } from "./lib/catalogue-history.mjs";
import {
  REFRESH_DOMAINS,
  formatRefreshSummary,
  selectRefreshDomains,
  summarizeSourceHealth,
} from "./lib/data-refresh.mjs";

function validateCatalogue() {
  const raw = JSON.parse(readFileSync("public/data/catalogue.json", "utf8"));
  const parsed = datasetSchema.parse(raw);
  validateCatalogueRelationships(parsed);
}

const selection = process.argv[2] ?? "all";
const domains = selectRefreshDomains(selection);
validateCatalogue();

const results = [];
const collectorFailures = [];
for (const domain of domains) {
  const definition = REFRESH_DOMAINS[domain];
  if (definition.status === "manual-review") {
    results.push({
      label: definition.label,
      status: "Manual review required",
      details: definition.reason,
    });
    continue;
  }

  const [script, ...args] = definition.command;
  const previousOutput = definition.output[0] && (() => {
    try { return JSON.parse(readFileSync(definition.output[0], "utf8")); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  })();
  console.log(`Refreshing ${definition.label}...`);
  const run = spawnSync(process.execPath, ["--experimental-strip-types", script, ...args], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (run.error || run.status !== 0) {
    const reason = run.error?.message ?? `exit code ${run.status ?? "unknown"}`;
    const details = `Collector failed (${reason}). Source registry entries, if present, reflect the last recorded source attempts and may not represent this run.`;
    results.push({ label: definition.label, status: "Collector failed", details });
    collectorFailures.push(`${definition.label}: ${reason}`);
    continue;
  }

  const registry = JSON.parse(readFileSync("public/data/refresh-candidates/source-registry.json", "utf8"));
  const sourceHealth = summarizeSourceHealth(domain, registry.sources);
  let details = `${sourceHealth.details} Source: ${definition.source}. Output: ${definition.output.join(", ")}.`;
  if (domain === "exchange-rates") {
    const current = JSON.parse(readFileSync(definition.output[0], "utf8"));
    const currencies = Object.keys(current.rates).filter((currency) =>
      previousOutput?.rates?.[currency] !== current.rates[currency],
    );
    details += ` Reference date: ${previousOutput?.date ?? "initial"} → ${current.date}; changed currencies: ${currencies.length ? currencies.join(", ") : "none"}.`;
  }
  results.push({
    label: definition.label,
    status: sourceHealth.status,
    details,
    sourceHealth,
  });
}

validateCatalogue();
const summary = formatRefreshSummary(results);
console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
if (process.env.GITHUB_OUTPUT) {
  // git diff does not include untracked collector outputs; status --porcelain does.
  const status = spawnSync("git", ["status", "--porcelain", "--", "public/data"], { encoding: "utf8" });
  if (status.error) throw status.error;
  if (status.status !== 0) throw new Error("Unable to inspect generated data changes.");
  const hasChanges = status.stdout.trim().length > 0;
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `has-changes=${hasChanges}\nsummary<<COMPUTE_LEDGER_SUMMARY\n${summary}\nCOMPUTE_LEDGER_SUMMARY\n`,
  );
}

if (collectorFailures.length > 0) {
  throw new Error(`One or more data collectors failed: ${collectorFailures.join("; ")}`);
}
