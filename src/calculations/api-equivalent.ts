export interface ApiEquivalentInputs {
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
  requestsPerMonth: number;
  cachedInputShare: number;
  inputPerMillion: number;
  cachedInputPerMillion?: number;
  outputPerMillion: number;
}
export interface ApiEquivalentResult {
  totalInputTokens: number;
  uncachedInputTokens: number;
  cachedInputTokens: number;
  totalOutputTokens: number;
  uncachedInputCost: number;
  cachedInputCost: number;
  outputCost: number;
  totalCost: number;
  costPerRequest: number;
  usedPublishedCacheRate: boolean;
}
/** Customer-facing API list-price equivalent, not internal serving cost. */
export function estimateApiEquivalent(input: ApiEquivalentInputs): ApiEquivalentResult {
  const values = [input.inputTokensPerRequest,input.outputTokensPerRequest,input.requestsPerMonth,input.cachedInputShare,input.inputPerMillion,input.cachedInputPerMillion ?? input.inputPerMillion,input.outputPerMillion];
  if (values.some((value) => !Number.isFinite(value))) throw new Error("All API-equivalent inputs must be finite numbers.");
  if (values.some((value) => value < 0)) throw new Error("Token counts, rates and request counts cannot be negative.");
  if (input.cachedInputShare > 1) throw new Error("Cached input share must be between zero and one.");
  const totalInputTokens=input.inputTokensPerRequest*input.requestsPerMonth;
  const totalOutputTokens=input.outputTokensPerRequest*input.requestsPerMonth;
  const cachedInputTokens=totalInputTokens*input.cachedInputShare;
  const uncachedInputTokens=totalInputTokens-cachedInputTokens;
  const usedPublishedCacheRate=input.cachedInputPerMillion!==undefined;
  const cacheRate=input.cachedInputPerMillion??input.inputPerMillion;
  const uncachedInputCost=uncachedInputTokens/1_000_000*input.inputPerMillion;
  const cachedInputCost=cachedInputTokens/1_000_000*cacheRate;
  const outputCost=totalOutputTokens/1_000_000*input.outputPerMillion;
  const totalCost=uncachedInputCost+cachedInputCost+outputCost;
  return {totalInputTokens,uncachedInputTokens,cachedInputTokens,totalOutputTokens,uncachedInputCost,cachedInputCost,outputCost,totalCost,costPerRequest:input.requestsPerMonth>0?totalCost/input.requestsPerMonth:0,usedPublishedCacheRate};
}
