import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveRegionProvider, useInLiveRegion } from "./live-region-context.js";

function Inspector() {
  const inLiveRegion = useInLiveRegion();
  return <span data-testid="result">{inLiveRegion ? "true" : "false"}</span>;
}

describe("LiveRegionContext", () => {
  it("defaults to false when no provider is mounted", () => {
    render(<Inspector />);
    expect(screen.getByTestId("result")).toHaveTextContent("false");
  });

  it("returns true when wrapped in LiveRegionProvider value={true}", () => {
    render(
      <LiveRegionProvider value={true}>
        <Inspector />
      </LiveRegionProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("true");
  });

  it("returns false when wrapped in LiveRegionProvider value={false}", () => {
    render(
      <LiveRegionProvider value={false}>
        <Inspector />
      </LiveRegionProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("false");
  });

  it("inner provider overrides outer", () => {
    render(
      <LiveRegionProvider value={true}>
        <LiveRegionProvider value={false}>
          <Inspector />
        </LiveRegionProvider>
      </LiveRegionProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("false");
  });
});
