import { readFile } from "node:fs/promises";
import { benchmarkDatasetSchema, benchmarkResultSchema } from "../src/data/schema.ts";
import { fetchJsonObserved, recordSourceHealth, writeJsonAtomic } from "./lib/refresh-io.mjs";

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
  const fetched = await fetchJsonObserved({
    id: `huggingface-${benchmark.id}`, url: sourceUrl,
    publisher: "Hugging Face", domain: "benchmarks",
    strategy: "public-leaderboard-json-api",
    automationSuitability: "independent-results-review-required",
  });
  if (fetched.status !== "fetched") {
    console.warn(`Benchmark source ${benchmark.id} is ${fetched.status}; skipping it. ${fetched.error}`);
    continue;
  }
  const rows = fetched.data;
  if (!Array.isArray(rows)) {
    await recordSourceHealth({
      id: `huggingface-${benchmark.id}`, url: sourceUrl,
      publisher: "Hugging Face", domain: "benchmarks",
      strategy: "public-leaderboard-json-api",
      automationSuitability: "independent-results-review-required",
      status: "invalid_response",
      error: "Leaderboard response was not an array.",
    });
    console.warn(`Leaderboard response for ${benchmark.datasetId} was invalid; skipping it.`);
    continue;
  }

  for (const row of rows) {
    if (typeof row.modelId !== "string" || !Number.isFinite(row.value)) continue;
    const modelName = row.modelId.split("/").at(-1);
    const mappedModelId = knownAliases.get(row.modelId.toLowerCase())
      ?? knownAliases.get(modelName.toLowerCase())
      ?? null;
    const record = {
      id: `${benchmark.id}:${row.rank ?? results.length + 1}:${row.modelId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      benchmarkId: benchmark.id,
      benchmarkName: benchmark.name,
      modelId: row.modelId,
      modelName,
      catalogueModelId: mappedModelId,
      score: row.value,
      ...(Number.isInteger(row.rank) && row.rank > 0 ? { rank: row.rank } : {}),
      scoreUnit: "percent",
      ...(typeof row.lower_is_better === "boolean" ? { higherIsBetter: !row.lower_is_better } : {}),
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

if (results.length === 0) {
  console.warn("No benchmark sources returned usable rows; retaining the last-known-good benchmark dataset.");
  process.exit(0);
}

const dataset = benchmarkDatasetSchema.parse({
  schemaVersion: 1,
  observedAt,
  source: "Hugging Face public benchmark leaderboard API",
  methodology: "Each benchmark is kept separate. Scores are not combined into an overall model rating. Evaluation dates are left unknown when the source does not provide them.",
  results,
});
await writeJsonAtomic("public/data/benchmarks.json", dataset);
console.log(`Collected ${results.length} benchmark observations across ${benchmarkSources.length} leaderboards.`);
