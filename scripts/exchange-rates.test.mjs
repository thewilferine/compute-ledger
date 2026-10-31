import { describe, expect, it } from "vitest";
import { parseExchangeRates } from "./lib/exchange-rates.mjs";

describe("exchange-rate collector parsing", () => {
  const rows = [
    { base: "EUR", quote: "GBP", rate: 0.86, date: "2026-10-30" },
    { base: "EUR", quote: "USD", rate: 1.16, date: "2026-10-30" },
  ];

  it("parses a complete set of dated ECB rates", () => {
    expect(parseExchangeRates(rows, ["GBP", "USD"])).toEqual({
      date: "2026-10-30",
      base: "EUR",
      rates: { EUR: 1, GBP: 0.86, USD: 1.16 },
      source: "European Central Bank via Frankfurter",
    });
  });

  it("rejects an empty or incomplete response", () => {
    expect(() => parseExchangeRates([], ["GBP"])).toThrow(/no rates/i);
    expect(() => parseExchangeRates(rows.slice(0, 1), ["GBP", "USD"])).toThrow(/no EUR reference rate/i);
  });

  it("rejects invalid, duplicate and mixed-date rows", () => {
    expect(() => parseExchangeRates([{ ...rows[0], rate: 0 }], ["GBP"])).toThrow(/invalid row/i);
    expect(() => parseExchangeRates([...rows, rows[0]], ["GBP", "USD"])).toThrow(/duplicate rate/i);
    expect(() => parseExchangeRates([rows[0], { ...rows[1], date: "2026-10-29" }], ["GBP", "USD"])).toThrow(/multiple dates/i);
  });
});
