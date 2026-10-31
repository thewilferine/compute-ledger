import { describe, expect, it } from "vitest";
import { extractPriceMentions, htmlToText } from "./lib/refresh-io.mjs";

describe("refresh source extraction", () => {
  it("converts HTML to readable text without script and style contents", () => {
    expect(htmlToText("<h1>Plans</h1><script>ignore()</script><style>.x{}</style><p>£20 / month</p>"))
      .toBe("Plans £20 / month");
  });

  it("extracts currency mentions with surrounding context", () => {
    const mentions = extractPriceMentions("Plus costs $20/month. Pro costs £100 per month.");
    expect(mentions.map((item) => item.text)).toEqual(["$20", "£100"]);
    expect(mentions[0].context).toContain("Plus costs");
    expect(mentions[1].context).toContain("Pro costs");
  });

  it("does not invent a price when no currency amount is present", () => {
    expect(extractPriceMentions("Usage varies by demand.")).toEqual([]);
  });
});
