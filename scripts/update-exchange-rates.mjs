import { readFile, rename, writeFile } from "node:fs/promises";
import { parseExchangeRates } from "./lib/exchange-rates.mjs";
import { fetchJsonObserved, recordSourceHealth } from "./lib/refresh-io.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const currencies = [...new Set(catalogue.subscriptionPlans.map((plan) => plan.currency))];
const quotes = [...new Set(["EUR", ...currencies])].join(",");
const source = {
  id: "frankfurter-ecb-reference-rates",
  url: `https://api.frankfurter.dev/v2/rates?base=EUR&quotes=${quotes.toLowerCase()}&providers=ecb`,
  publisher: "Frankfurter / European Central Bank",
  domain: "exchange-rates",
  strategy: "ecb-reference-rates-json-api",
  automationSuitability: "automated-reference-data",
};
const fetched = await fetchJsonObserved(source);
if (fetched.status !== "fetched") {
  console.warn(`Exchange-rate source is ${fetched.status}; retaining the last-known-good rates. ${fetched.error}`);
  process.exit(0);
}
let rates;
try {
  rates = parseExchangeRates(fetched.data, currencies);
} catch (error) {
  await recordSourceHealth({
    ...source, status: "invalid_response",
    error: error instanceof Error ? error.message : String(error),
  });
  console.warn("Exchange-rate response was invalid; retaining the last-known-good rates.");
  process.exit(0);
}
const outputPath = "public/data/exchange-rates.json";
const temporaryPath = `${outputPath}.tmp`;

// Write only after the entire response has passed validation, then atomically
// replace the previous snapshot so a failed write cannot truncate good data.
await writeFile(temporaryPath, JSON.stringify(rates, null, 2) + "\n");
await rename(temporaryPath, outputPath);

console.log(
  `Updated ECB reference rates dated ${rates.date} for ${Object.keys(rates.rates).length - 1} currencies.`,
);
