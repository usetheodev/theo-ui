import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewPanel } from "./preview-panel.js";

describe("PreviewPanel", () => {
  it("renders the URL and content slot", () => {
    render(
      <PreviewPanel
        url="http://localhost:3000"
        content={<iframe title="preview" src="about:blank" />}
      />,
    );
    expect(screen.getByLabelText("Address")).toHaveValue("http://localhost:3000");
    expect(screen.getByTitle("preview")).toBeInTheDocument();
  });

  it("renders the logs slot when provided", () => {
    render(
      <PreviewPanel
        url="x"
        content={<div data-testid="content">x</div>}
        logsSlot={<div data-testid="logs">hmr logs…</div>}
      />,
    );
    expect(screen.getByTestId("logs")).toBeInTheDocument();
  });
});
