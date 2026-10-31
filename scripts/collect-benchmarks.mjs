import { readFile } from "node:fs/promises";
import { benchmarkResultSchema } from "../src/data/schema.ts";
import { fetchJson, writeJsonAtomic } from "./lib/refresh-io.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const benchmarkSources = [
  {
    id: "swe-bench-verified",
    name: "SWE-bench Verified",
    datasetId: "SWE-bench/SWE-bench_Verified",
    description: "Evaluates whether models can resolve real-world GitHub issues in software repositories.",
    methodologyUrl: "https://www.swebench.com/",
  },
  {
    id: "gsm8k",
    name: "GSM8K",
    datasetId: "openai/gsm8k",
    description: "Grade-school mathematical reasoning benchmark.",
    methodologyUrl: "https://github.com/openai/grade-school-math",
  },
];
const observedAt = new Date().toISOString().slice(0, 10);
const knownAliases = new Map();
for (const model of catalogue.models) {
  knownAliases.set(model.name.toLowerCase(), model.id);
  if (model.apiModelId) knownAliases.set(model.apiModelId.toLowerCase(), model.id);
}

const results = [];
for (const benchmark of benchmarkSources) {
  const sourceUrl = `https://huggingface.co/api/datasets/${benchmark.datasetId}/leaderboard`;
  const rows = await fetchJson(sourceUrl);
  if (!Array.isArray(rows)) throw new Error(`Leaderboard response for ${benchmark.datasetId} was not an array.`);

  for (const row of rows) {
    if (typeof row.modelId !== "string" || !Number.isFinite(row.value)) continue;
    const modelName = row.modelId.split("/").at(-1);
    const mappedModelId = knownAliases.get(row.modelId.toLowerCase())
      ?? knownAliases.get(modelName.toLowerCase())
      ?? null;
    const record = {
      id: `${benchmark.id}:${row.modelId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      benchmarkId: benchmark.id,
      benchmarkName: benchmark.name,
      modelId: row.modelId,
      modelName,
      catalogueModelId: mappedModelId,
      score: row.value,
      scoreUnit: "percent",
      higherIsBetter: row.lower_is_better === false,
      evaluationDate: null,
      observedAt,
      sourceUrl: row.source?.url ?? `https://huggingface.co/${row.modelId}`,
      leaderboardUrl: sourceUrl,
      methodologyUrl: benchmark.methodologyUrl,
      verified: row.verified === true,
      resultStatus: row.verified === true ? "verified" : "unverified",
      notes: row.notes ?? null,
      submissionFile: row.filename ?? null,
      sourceDatasetId: benchmark.datasetId,
    };
    results.push(benchmarkResultSchema.parse(record));
  }
}

if (results.length === 0) throw new Error("No benchmark result rows were returned by the configured public leaderboards.");

await writeJsonAtomic("public/data/benchmarks.json", {
  schemaVersion: 1,
  observedAt,
  source: "Hugging Face public benchmark leaderboard API",
  methodology: "Each benchmark is kept separate. Scores are not combined into an overall model rating. Evaluation dates are left unknown when the source does not provide them.",
  results,
});
console.log(`Collected ${results.length} benchmark observations across ${benchmarkSources.length} leaderboards.`);
