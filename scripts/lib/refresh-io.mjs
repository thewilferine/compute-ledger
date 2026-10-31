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
  const pattern = /(?:USD|GBP|EUR|\$|£|€)\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|(?:\$|£|€)\s?\d+(?:\.\d{1,2})?/gi;
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
