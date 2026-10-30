import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";

describe("App", () => {
  it("renders the project introduction", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("The Compute Ledger");
    expect(html).toContain("What does AI really cost to serve?");
  });
});
