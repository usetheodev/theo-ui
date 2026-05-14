import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArtifactPreview } from "./artifact-preview.js";

describe("ArtifactPreview", () => {
  it("renders the title, source, and children", () => {
    render(
      <ArtifactPreview title="Expense report" source="Google Drive">
        <div data-testid="preview">spreadsheet</div>
      </ArtifactPreview>,
    );
    expect(screen.getByText("Expense report")).toBeInTheDocument();
    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByTestId("preview")).toBeInTheDocument();
  });

  it("calls toolbar handlers when default toolbar buttons are clicked", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onClose = vi.fn();
    render(
      <ArtifactPreview title="t" onRefresh={onRefresh} onClose={onClose}>
        x
      </ArtifactPreview>,
    );
    await user.click(screen.getByRole("button", { name: /refresh/i }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
