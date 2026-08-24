import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RunStats } from "./run-stats.js";

describe("RunStats", () => {
  it("renders no stats when none provided", () => {
    const { container } = render(<RunStats />);
    expect(container.firstChild).not.toBeNull();
    expect(container.textContent ?? "").toBe("");
  });

  it("renders duration, tokens, and files when provided", () => {
    render(<RunStats duration="12s" tokens="35.7k" filesChanged={4} />);
    expect(screen.getByText(/12s/)).toBeInTheDocument();
    expect(screen.getByText(/35\.7k tokens/)).toBeInTheDocument();
    expect(screen.getByText(/4 files/)).toBeInTheDocument();
  });

  it("omits sections that are undefined", () => {
    render(<RunStats tokens="1.2k" />);
    expect(screen.getByText(/1\.2k tokens/)).toBeInTheDocument();
    expect(screen.queryByText(/files/)).not.toBeInTheDocument();
  });
});
