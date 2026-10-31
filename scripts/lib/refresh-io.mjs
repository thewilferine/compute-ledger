import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "user-agent": "ComputeLedgerDataRefresh/1.0 (+https://github.com/thewilferine/compute-ledger)",
      ...options.headers,
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,text/markdown,text/plain;q=0.9,*/*;q=0.8",
      "user-agent": "ComputeLedgerDataRefresh/1.0 (+https://github.com/thewilferine/compute-ledger)",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Source page failed for ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  const body = await response.text();
  if (!body.trim()) throw new Error(`Source page returned an empty body: ${url}`);
  return { body, contentType: response.headers.get("content-type") ?? "unknown" };
}

export function htmlToText(value) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPriceMentions(text, { limit = 100 } = {}) {
  const pattern = /(?:USD|GBP|EUR|\$|£|€)\s?\d+(?:,\d{3})*(?:\.\d{1,2})?|(?:\$|£|€)\s?\d+(?:\.\d{1,2})?/gi;
  const results = [];
  for (const match of text.matchAll(pattern)) {
    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + match[0].length + 100);
    results.push({ text: match[0].replace(/\s+/g, " ").trim(), context: text.slice(start, end) });
    if (results.length >= limit) break;
  }
  return results;
}

export async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

export function classifySourceError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const status = Number(error?.status ?? message.match(/HTTP (\d{3})/)?.[1]);
  if (status === 403) return "blocked";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "transient_failure";
  if (status >= 400) return "unavailable";
  if (/json|parse|unexpected token/i.test(message)) return "invalid_response";
  if (/timeout|timed out|network|fetch failed|socket/i.test(message)) return "transient_failure";
  return "unavailable";
}

export async function recordSourceHealth({
  id, url, publisher = null, domain, strategy = "html-page",
  automationSuitability = "candidate-only", status, error = null,
  checkedAt = new Date().toISOString(),
}) {
  const path = "public/data/refresh-candidates/source-registry.json";
  let registry = { schemaVersion: 1, updatedAt: checkedAt, sources: [] };
  try { registry = JSON.parse(await (await import("node:fs/promises")).readFile(path, "utf8")); }
  catch (readError) { if (readError.code !== "ENOENT") throw readError; }
  const previous = registry.sources.find((item) => item.id === id);
  const entry = {
    id, url, publisher, domain, strategy, automationSuitability,
    firstSeenAt: previous?.firstSeenAt ?? checkedAt,
    lastAttemptAt: checkedAt,
    lastSuccessfulAt: status === "fetched" ? checkedAt : (previous?.lastSuccessfulAt ?? null),
    status,
    lastError: error,
    consecutiveFailures: status === "fetched" ? 0 : status === "manual_review" ? (previous?.consecutiveFailures ?? 0) : (previous?.consecutiveFailures ?? 0) + 1,
  };
  const sources = registry.sources.filter((item) => item.id !== id);
  sources.push(entry);
  sources.sort((a, b) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id));
  await writeJsonAtomic(path, { schemaVersion: 1, updatedAt: checkedAt, sources });
  return entry;
}

export async function fetchPageObserved(source) {
  const checkedAt = new Date().toISOString();
  try {
    const result = await fetchPage(source.url);
    await recordSourceHealth({ ...source, status: "fetched", checkedAt });
    return { status: "fetched", ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = classifySourceError(error);
    await recordSourceHealth({ ...source, status, error: message, checkedAt });
    return { status, error: message };
  }
}

export async function fetchJsonObserved(source) {
  const checkedAt = new Date().toISOString();
  try {
    const result = await fetchJson(source.url);
    await recordSourceHealth({ ...source, status: "fetched", checkedAt });
    return { status: "fetched", data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = classifySourceError(error);
    await recordSourceHealth({ ...source, status, error: message, checkedAt });
    return { status, error: message };
  }
}

export async function recordManualSource(source) {
  return recordSourceHealth({ ...source, status: "manual_review", error: null });
}
