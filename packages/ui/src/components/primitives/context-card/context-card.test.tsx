import { render, screen } from "@testing-library/react";
import { Sparkles } from "lucide-react";
import { describe, expect, it } from "vitest";
import { ContextCard } from "./context-card.js";

describe("ContextCard", () => {
  it("renders title and description", () => {
    render(<ContextCard title="Context" description="Helpful intro to the task." />);
    expect(screen.getByRole("heading", { name: "Context" })).toBeInTheDocument();
    expect(screen.getByText("Helpful intro to the task.")).toBeInTheDocument();
  });

  it("uses the provided icon when no illustration is given", () => {
    const { container } = render(<ContextCard title="Inbox" icon={Sparkles} />);
    expect(container.querySelector("svg.lucide-sparkles")).not.toBeNull();
  });

  it("renders illustration slot in place of icon", () => {
    render(<ContextCard title="Empty" illustration={<div data-testid="hero">Illustration</div>} />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });
});
