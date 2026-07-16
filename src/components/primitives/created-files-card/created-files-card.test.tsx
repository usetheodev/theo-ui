import { render, screen, within } from "@testing-library/react";
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

  // M3: the "edited" variant (coding-agent changed files).
  const edited: CreatedFile[] = [
    { id: "1", name: "agents/support-agent.ts", additions: 12, deletions: 3 },
    { id: "2", name: "agents/tools/lookup.ts", additions: 22, deletions: 0 },
  ];

  it("edited variant flips the default title to 'Edited N files'", () => {
    render(<CreatedFilesCard variant="edited" files={edited} />);
    expect(screen.getByRole("heading", { name: /Edited 2 files/i })).toBeInTheDocument();
  });

  it("renders per-file additions/deletions when present", () => {
    render(<CreatedFilesCard variant="edited" files={edited} />);
    expect(screen.getByText("+12")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("created variant is unchanged (regression)", () => {
    render(<CreatedFilesCard files={files} />);
    expect(screen.getByRole("heading", { name: /Files created/i })).toBeInTheDocument();
  });

  // 1.2.0: aggregate +/- in the header + inline CTA (coding-agent edited-files card).
  const plain: CreatedFile[] = [
    { id: "1", name: "prompts/support-tone.md" },
    { id: "2", name: "agents/support-agent.ts" },
  ];

  it("shows aggregate +/- in the header when headerAggregate is provided (edited)", () => {
    render(
      <CreatedFilesCard
        variant="edited"
        files={plain}
        headerAggregate={{ additions: 6, deletions: 3 }}
      />,
    );
    // plain files carry no per-file counts → the only +6/-3 is the header aggregate
    expect(screen.getByText("+6")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("places the cta in the header row when ctaPlacement='header'", () => {
    const { container } = render(
      <CreatedFilesCard
        variant="edited"
        files={plain}
        ctaPlacement="header"
        cta={<button type="button">Review</button>}
      />,
    );
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(
      within(header as HTMLElement).getByRole("button", { name: "Review" }),
    ).toBeInTheDocument();
  });

  it("defaults the cta to the footer, not the header (regression)", () => {
    const { container } = render(
      <CreatedFilesCard files={files} cta={<button type="button">Move</button>} />,
    );
    const header = container.querySelector("header");
    expect(within(header as HTMLElement).queryByRole("button", { name: "Move" })).toBeNull();
    expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument();
  });
});
