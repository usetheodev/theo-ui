import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type CreatedFile, CreatedFilesCard } from "./created-files-card.js";

const files: CreatedFile[] = [
  { id: "1", name: "expense-q1.xlsx", size: "42 KB", destination: "Google Drive · /Reports" },
  { id: "2", name: "report.pdf", href: "https://example.com/report.pdf" },
];

describe("CreatedFilesCard", () => {
  it("renders default title and the file list", () => {
    render(<CreatedFilesCard files={files} />);
    expect(screen.getByRole("heading", { name: /Files created/i })).toBeInTheDocument();
    expect(screen.getByText("expense-q1.xlsx")).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText(/42 KB/)).toBeInTheDocument();
    expect(screen.getByText(/Google Drive/)).toBeInTheDocument();
  });

  it("renders the file as a link when href is provided", () => {
    render(<CreatedFilesCard files={files} />);
    const link = screen.getByText("report.pdf").closest("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("https://example.com/report.pdf");
  });

  it("renders the cta slot", () => {
    render(<CreatedFilesCard files={files} cta={<button type="button">Move to drive</button>} />);
    expect(screen.getByRole("button", { name: /Move to drive/ })).toBeInTheDocument();
  });
});
