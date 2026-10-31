import { readFile, writeFile } from "node:fs/promises";

const catalogue = JSON.parse(await readFile("public/data/catalogue.json", "utf8"));
const currencies = [...new Set(catalogue.subscriptionPlans.map((plan) => plan.currency))];
const quotes = [...new Set(["EUR", ...currencies])].join(",");
const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=EUR&quotes=${quotes.toLowerCase()}&providers=ecb`);
if (!response.ok) throw new Error(`Exchange-rate request failed: ${response.status} ${response.statusText}`);
const rows = await response.json();
if (!Array.isArray(rows) || rows.length === 0) throw new Error("Exchange-rate API returned no rates");

const rates = { EUR: 1 };
let date;
for (const row of rows) {
  if (row.base !== "EUR" || !currencies.includes(row.quote) && row.quote !== "EUR" || !Number.isFinite(row.rate) || row.rate <= 0) {
    throw new Error("Exchange-rate API returned an invalid row");
  }
  date = row.date;
  rates[row.quote] = row.rate;
}
for (const currency of currencies) {
  if (rates[currency] === undefined) throw new Error(`No EUR reference rate returned for ${currency}`);
}
if (!date || Object.keys(rates).length < currencies.length + 1) throw new Error("Exchange-rate snapshot is incomplete");

await writeFile("public/data/exchange-rates.json", JSON.stringify({
  date,
  base: "EUR",
  rates,
  source: "European Central Bank via Frankfurter"
}, null, 2) + "\n");
console.log(`Updated ECB reference rates dated ${date} for ${Object.keys(rates).length - 1} currencies.`);
