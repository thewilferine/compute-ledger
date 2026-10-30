import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";

describe("Compute Ledger app", () => {
  it("renders the dashboard and project navigation", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Compute Ledger");
    expect(html).toContain("What does AI really cost to serve?");
    expect(html).toContain("Providers");
    expect(html).toContain("Subscriptions");
    expect(html).toContain("Methodology");
  });

  it("includes an interactive inference calculator entry point", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Calculator");
  });
});
