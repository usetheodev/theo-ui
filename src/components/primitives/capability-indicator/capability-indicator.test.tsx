import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapabilityIndicator, capabilityPresets } from "./capability-indicator.js";

describe("CapabilityIndicator", () => {
  it("renders the labels of each capability", () => {
    render(
      <CapabilityIndicator
        capabilities={[
          { ...capabilityPresets.read },
          { ...capabilityPresets.write },
          { ...capabilityPresets.bash, state: "blocked" },
        ]}
      />,
    );
    expect(screen.getByText("Read files")).toBeInTheDocument();
    expect(screen.getByText("Write files")).toBeInTheDocument();
    expect(screen.getByText("Run shell")).toBeInTheDocument();
  });

  it("uses the agent-capabilities aria-label on the list", () => {
    render(<CapabilityIndicator capabilities={[{ ...capabilityPresets.read }]} />);
    expect(screen.getByRole("list", { name: /Agent capabilities/i })).toBeInTheDocument();
  });

  it("renders capability presets with the expected ids and labels", () => {
    expect(capabilityPresets.deploy.id).toBe("deploy");
    expect(capabilityPresets.network.label).toBe("Network");
  });
});
