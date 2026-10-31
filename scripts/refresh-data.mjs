import { appendFile, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { datasetSchema } from "../src/data/schema.ts";
import { validateCatalogueRelationships } from "./lib/catalogue-history.mjs";
import {
  REFRESH_DOMAINS,
  formatRefreshSummary,
  selectRefreshDomains,
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
  console.log(`Refreshing ${definition.label}...`);
  const run = spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error(`${definition.label} collector failed with exit code ${run.status ?? "unknown"}.`);
  }
  results.push({
    label: definition.label,
    status: "Updated successfully",
    details: `Source: ${definition.source}. Output: ${definition.output.join(", ")}.`,
  });
}

validateCatalogue();
const summary = formatRefreshSummary(results);
console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `summary<<COMPUTE_LEDGER_SUMMARY\n${summary}\nCOMPUTE_LEDGER_SUMMARY\n`,
  );
}
