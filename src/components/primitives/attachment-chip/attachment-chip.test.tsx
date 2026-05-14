import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttachmentChip } from "./attachment-chip.js";

describe("AttachmentChip", () => {
  it("renders the attachment name and size", () => {
    render(
      <AttachmentChip
        attachment={{ id: "a1", name: "report.csv", type: "spreadsheet", size: "12 KB" }}
      />,
    );
    expect(screen.getByText("report.csv")).toBeInTheDocument();
    expect(screen.getByText(/12 KB/)).toBeInTheDocument();
  });

  it("does not render remove button when onRemove is not provided", () => {
    render(<AttachmentChip attachment={{ id: "a1", name: "x.txt" }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRemove with the attachment id when remove clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<AttachmentChip attachment={{ id: "att-42", name: "data.json" }} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: /Remove data\.json/ }));
    expect(onRemove).toHaveBeenCalledWith("att-42");
  });
});
