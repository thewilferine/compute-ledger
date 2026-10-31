import { z } from "zod";

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.string().date(),
  notes: z.string().optional(),
});

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  website: z.string().url(),
  sources: z.array(z.string()),
});

export const modelSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  modality: z.array(z.enum(["text", "image", "audio", "video"])),
  contextWindowTokens: z.number().int().positive().optional(),
  apiModelId: z.string().min(1).optional(),
  sources: z.array(z.string()),
  availability: z.enum(["current", "preview", "previous-generation", "retired"]).optional(),
  releaseDate: z.string().date().optional(),
  notes: z.string().optional(),
  positioning: z.enum(["flagship", "balanced", "efficient", "specialist", "previous-generation"]).optional(),
});

export const subscriptionPlanSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  billingPeriod: z.enum(["monthly", "annual"]),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  region: z.string().min(2),
  observedAt: z.string().date(),
  sources: z.array(z.string()).min(1),
  notes: z.string().optional(),
  usageLimitType: z.enum(["dynamic", "tier-multiplier", "shared-pool", "not-published"]).optional(),
  usageMultiplier: z.number().positive().optional(),
  usageLimitSummary: z.string().optional(),
  usageResetCadence: z.string().optional(),
  accessSummary: z.string().optional(),
});

export const apiPricingSchema = z.object({
  id: z.string().min(1),
  modelId: z.string().min(1),
  inputPerMillion: z.number().nonnegative(),
  outputPerMillion: z.number().nonnegative(),
  cachedInputPerMillion: z.number().nonnegative().optional(),
  currency: z.string().length(3),
  tier: z.string().min(1),
  observedAt: z.string().date(),
  sourceId: z.string().min(1),
  notes: z.string().optional(),
  cacheWrite5mPerMillion: z.number().nonnegative().optional(),
  cacheWrite1hPerMillion: z.number().nonnegative().optional(),
  effectiveFrom: z.string().date().optional(),
  effectiveTo: z.string().date().optional(),
});

export const benchmarkResultSchema = z.object({
  id: z.string().min(1),
  benchmarkId: z.string().min(1),
  benchmarkName: z.string().min(1),
  modelId: z.string().min(1),
  modelName: z.string().min(1),
  catalogueModelId: z.string().min(1).nullable().optional(),
  score: z.number().finite(),
  scoreUnit: z.string().min(1),
  higherIsBetter: z.boolean().optional(),
  evaluationDate: z.string().date().nullable().optional(),
  observedAt: z.string().date(),
  sourceUrl: z.string().url(),
  leaderboardUrl: z.string().url(),
  methodologyUrl: z.string().url().optional(),
  verified: z.boolean(),
  resultStatus: z.enum(["verified", "unverified"]),
  notes: z.string().nullable().optional(),
  submissionFile: z.string().nullable().optional(),
  sourceDatasetId: z.string().min(1),
});

export const benchmarkDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  observedAt: z.string().date(),
  source: z.string().min(1),
  methodology: z.string().min(1),
  results: z.array(benchmarkResultSchema),
});

export const datasetSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string().datetime(),
  sources: z.array(sourceSchema),
  providers: z.array(providerSchema),
  models: z.array(modelSchema),
  subscriptionPlans: z.array(subscriptionPlanSchema),
  apiPricing: z.array(apiPricingSchema),
});

export type Source = z.infer<typeof sourceSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Model = z.infer<typeof modelSchema>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
