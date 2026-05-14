import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelCard, type ModelInfo } from "./model-card.js";

const model: ModelInfo = {
  id: "opus-4.7",
  name: "Opus 4.7",
  vendor: "Anthropic",
  contextWindow: 1_000_000,
  maxOutput: 32_000,
  pricePerMInput: 15,
  pricePerMOutput: 75,
  cutoff: "Jan 2026",
  description: "Most capable Claude model.",
};

describe("ModelCard", () => {
  it("renders the model name, vendor, and metadata", () => {
    render(<ModelCard model={model} />);
    expect(screen.getByText("Opus 4.7")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText(/Jan 2026/)).toBeInTheDocument();
  });

  it("renders the formatted context window", () => {
    render(<ModelCard model={model} />);
    expect(screen.getByText(/1M/)).toBeInTheDocument();
  });

  it("fires onSelect when the card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ModelCard model={model} onSelect={onSelect} />);
    await user.click(screen.getByText("Opus 4.7"));
    expect(onSelect).toHaveBeenCalledWith("opus-4.7");
  });
});
