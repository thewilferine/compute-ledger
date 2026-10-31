import { readFile, rename, writeFile } from "node:fs/promises";
import { parseExchangeRates } from "./lib/exchange-rates.mjs";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const currencies = [...new Set(catalogue.subscriptionPlans.map((plan) => plan.currency))];
const quotes = [...new Set(["EUR", ...currencies])].join(",");
const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=EUR&quotes=${quotes.toLowerCase()}&providers=ecb`);
if (!response.ok) {
  throw new Error(`Exchange-rate request failed: ${response.status} ${response.statusText}`);
}

const rates = parseExchangeRates(await response.json(), currencies);
const outputPath = "public/data/exchange-rates.json";
const temporaryPath = `${outputPath}.tmp`;

// Write only after the entire response has passed validation, then atomically
// replace the previous snapshot so a failed write cannot truncate good data.
await writeFile(temporaryPath, JSON.stringify(rates, null, 2) + "\n");
await rename(temporaryPath, outputPath);

console.log(
  `Updated ECB reference rates dated ${rates.date} for ${Object.keys(rates.rates).length - 1} currencies.`,
);
