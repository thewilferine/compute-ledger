export function parseExchangeRates(rows, currencies) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Exchange-rate API returned no rates.");
  }

  const requiredCurrencies = [...new Set(currencies)];
  const allowedCurrencies = new Set(["EUR", ...requiredCurrencies]);
  const rates = { EUR: 1 };
  let date;

  for (const row of rows) {
    if (
      !row ||
      row.base !== "EUR" ||
      typeof row.quote !== "string" ||
      !allowedCurrencies.has(row.quote) ||
      !Number.isFinite(row.rate) ||
      row.rate <= 0 ||
      typeof row.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      Number.isNaN(Date.parse(`${row.date}T00:00:00Z`))
    ) {
      throw new Error("Exchange-rate API returned an invalid row.");
    }
    if (date && date !== row.date) {
      throw new Error("Exchange-rate API returned rates from multiple dates.");
    }
    if (row.quote === "EUR") {
      if (row.rate !== 1) throw new Error("EUR must have a rate of exactly 1 against itself.");
      continue;
    }
    if (rates[row.quote] !== undefined) {
      throw new Error(`Exchange-rate API returned duplicate rate for ${row.quote}.`);
    }
    date = row.date;
    rates[row.quote] = row.rate;
  }

  for (const currency of requiredCurrencies) {
    if (rates[currency] === undefined) {
      throw new Error(`No EUR reference rate returned for ${currency}.`);
    }
  }

  if (!date) throw new Error("Exchange-rate snapshot is missing a reference date.");
  return {
    date,
    base: "EUR",
    rates,
    source: "European Central Bank via Frankfurter",
  };
}
