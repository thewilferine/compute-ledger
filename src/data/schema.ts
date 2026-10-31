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
