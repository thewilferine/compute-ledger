import { describe, expect, it } from "vitest";
import { benchmarkDatasetSchema, benchmarkResultSchema } from "./schema";

const result = {
  id: "swe-bench-verified:provider-model",
  benchmarkId: "swe-bench-verified",
  benchmarkName: "SWE-bench Verified",
  modelId: "provider/model",
  modelName: "model",
  catalogueModelId: null,
  score: 72.5,
  scoreUnit: "percent",
  higherIsBetter: true,
  evaluationDate: null,
  observedAt: "2026-10-31",
  sourceUrl: "https://huggingface.co/provider/model",
  leaderboardUrl: "https://huggingface.co/api/datasets/SWE-bench/SWE-bench_Verified/leaderboard",
  methodologyUrl: "https://www.swebench.com/",
  verified: false,
  resultStatus: "unverified",
  notes: null,
  submissionFile: ".eval_results/result.yaml",
  sourceDatasetId: "SWE-bench/SWE-bench_Verified",
};

describe("benchmark result schema", () => {
  it("accepts dated, attributable benchmark observations", () => {
    expect(benchmarkResultSchema.parse(result)).toEqual(result);
  });

  it("rejects invalid scores and missing provenance", () => {
    expect(benchmarkResultSchema.safeParse({ ...result, score: Number.NaN }).success).toBe(false);
    expect(benchmarkResultSchema.safeParse({ ...result, sourceUrl: "not-a-url" }).success).toBe(false);
  });

  it("validates the separate benchmark dataset envelope", () => {
    expect(benchmarkDatasetSchema.safeParse({
      schemaVersion: 1,
      observedAt: "2026-10-31",
      source: "Hugging Face",
      methodology: "Independent benchmarks remain separate.",
      results: [result],
    }).success).toBe(true);
  });
});
