import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExportChatDialog } from "./export-chat-dialog.js";

describe("ExportChatDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ExportChatDialog open={false} onOpenChange={() => {}} onExport={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all default formats when open", () => {
    render(<ExportChatDialog open onOpenChange={() => {}} onExport={() => {}} />);
    expect(screen.getByTestId("export-format-markdown")).toBeInTheDocument();
    expect(screen.getByTestId("export-format-json")).toBeInTheDocument();
    expect(screen.getByTestId("export-format-jsonl")).toBeInTheDocument();
    expect(screen.getByTestId("export-format-sharegpt")).toBeInTheDocument();
  });

  it("selects format and fires onExport with chosen format", async () => {
    const onExport = vi.fn();
    const onOpenChange = vi.fn();
    render(<ExportChatDialog open onOpenChange={onOpenChange} onExport={onExport} />);
    fireEvent.click(screen.getByTestId("export-format-json"));
    fireEvent.click(screen.getByTestId("export-chat-submit"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(onExport).toHaveBeenCalledWith("json");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables buttons during async export", async () => {
    let resolve: () => void = () => {};
    const pending = new Promise<void>((r) => {
      resolve = r;
    });
    render(<ExportChatDialog open onOpenChange={() => {}} onExport={() => pending} />);
    fireEvent.click(screen.getByTestId("export-chat-submit"));
    expect(screen.getByTestId("export-chat-submit")).toBeDisabled();
    expect(screen.getByTestId("export-chat-cancel")).toBeDisabled();
    await act(async () => {
      resolve();
      await pending;
    });
  });

  it("cancel button closes the dialog without exporting", () => {
    const onExport = vi.fn();
    const onOpenChange = vi.fn();
    render(<ExportChatDialog open onOpenChange={onOpenChange} onExport={onExport} />);
    fireEvent.click(screen.getByTestId("export-chat-cancel"));
    expect(onExport).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
