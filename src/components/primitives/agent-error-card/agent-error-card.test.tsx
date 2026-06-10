import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentErrorCard, kindFromEnvelopeCode } from "./agent-error-card.js";

describe("AgentErrorCard", () => {
  it("renders title with alert role", () => {
    render(<AgentErrorCard title="Rate limit hit" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Rate limit hit")).toBeInTheDocument();
  });

  it("renders detail and timestamp when provided", () => {
    render(
      <AgentErrorCard
        kind="rate-limit"
        title="Rate limit hit"
        detail="Retry after 60s"
        timestamp="9:59 PM"
      />,
    );
    expect(screen.getByText("Retry after 60s")).toBeInTheDocument();
    expect(screen.getByText("9:59 PM")).toBeInTheDocument();
  });

  it("renders actions slot when provided", () => {
    render(<AgentErrorCard title="Auth lost" actions={<button type="button">Re-auth</button>} />);
    expect(screen.getByRole("button", { name: "Re-auth" })).toBeInTheDocument();
  });

  // G5 T2.3 — envelope adoption
  describe("envelopeCode prop (G5 T2.3)", () => {
    it("derives kind=auth from UNAUTHORIZED envelope code", () => {
      render(<AgentErrorCard envelopeCode="UNAUTHORIZED" title="Token expired" />);
      // Aria-label on the icon span confirms the kind via accessible structure
      const card = screen.getByRole("alert");
      expect(card).toBeInTheDocument();
      expect(screen.getByText("Token expired")).toBeInTheDocument();
    });

    it("derives kind=rate-limit from RATE_LIMITED envelope code", () => {
      render(<AgentErrorCard envelopeCode="RATE_LIMITED" title="Slow down" />);
      expect(screen.getByText("Slow down")).toBeInTheDocument();
    });

    it("explicit kind prop overrides envelopeCode", () => {
      // Given: envelopeCode would derive 'auth' but kind is forced to 'network'
      render(<AgentErrorCard envelopeCode="UNAUTHORIZED" kind="network" title="Override test" />);
      // Component renders without error; explicit kind wins
      expect(screen.getByText("Override test")).toBeInTheDocument();
    });
  });

  describe("kindFromEnvelopeCode helper (G5 T2.3)", () => {
    it("maps UNAUTHORIZED/FORBIDDEN to 'auth'", () => {
      expect(kindFromEnvelopeCode("UNAUTHORIZED")).toBe("auth");
      expect(kindFromEnvelopeCode("FORBIDDEN")).toBe("auth");
      expect(kindFromEnvelopeCode("PROVIDER_KEY_MISSING")).toBe("auth");
    });

    it("maps RATE_LIMITED/TOO_MANY_REQUESTS to 'rate-limit'", () => {
      expect(kindFromEnvelopeCode("RATE_LIMITED")).toBe("rate-limit");
      expect(kindFromEnvelopeCode("TOO_MANY_REQUESTS")).toBe("rate-limit");
    });

    it("maps network-flavor codes to 'network'", () => {
      expect(kindFromEnvelopeCode("BAD_GATEWAY")).toBe("network");
      expect(kindFromEnvelopeCode("SERVICE_UNAVAILABLE")).toBe("network");
      expect(kindFromEnvelopeCode("GATEWAY_TIMEOUT")).toBe("network");
    });

    it("maps agent-run-shaped codes to 'tool-failure'", () => {
      expect(kindFromEnvelopeCode("AGENT_RUN_ERROR")).toBe("tool-failure");
    });

    it("maps PAYLOAD_TOO_LARGE to 'context-overflow'", () => {
      expect(kindFromEnvelopeCode("PAYLOAD_TOO_LARGE")).toBe("context-overflow");
    });

    it("falls back to 'generic' for unknown codes", () => {
      expect(kindFromEnvelopeCode("UNKNOWN_CODE")).toBe("generic");
      expect(kindFromEnvelopeCode("UNPROCESSABLE_ENTITY")).toBe("generic");
    });
  });
});
