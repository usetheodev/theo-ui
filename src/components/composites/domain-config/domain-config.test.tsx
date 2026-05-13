import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type Domain, DomainConfig } from "./domain-config.js";

const domains: Domain[] = [
  { id: "1", hostname: "acme.com", status: "verified", tls: true, primary: true },
  { id: "2", hostname: "api.acme.com", status: "verified", tls: true },
  {
    id: "3",
    hostname: "staging.acme.com",
    status: "pending",
    tls: false,
    verificationRecord: { type: "TXT", name: "_theo.staging", value: "theo-verify=abc123" },
  },
];

describe("DomainConfig", () => {
  it("renders all hostnames", () => {
    render(<DomainConfig domains={domains} />);
    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText("api.acme.com")).toBeInTheDocument();
    expect(screen.getByText("staging.acme.com")).toBeInTheDocument();
  });

  it("shows DNS verification record for pending domains", () => {
    render(<DomainConfig domains={domains} />);
    expect(screen.getByText("Add this DNS record to verify")).toBeInTheDocument();
    expect(screen.getByText("TXT")).toBeInTheDocument();
    expect(screen.getByText("_theo.staging")).toBeInTheDocument();
    expect(screen.getByText("theo-verify=abc123")).toBeInTheDocument();
  });

  it("marks primary domain with badge", () => {
    render(<DomainConfig domains={domains} />);
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("submits new hostname via add form", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<DomainConfig domains={domains} onAdd={onAdd} />);
    await user.type(screen.getByLabelText("Hostname"), "new.acme.com");
    await user.click(screen.getByRole("button", { name: /Add domain/ }));
    expect(onAdd).toHaveBeenCalledWith("new.acme.com");
  });

  it("calls onSetPrimary for non-primary domains", async () => {
    const user = userEvent.setup();
    const onSetPrimary = vi.fn();
    render(<DomainConfig domains={domains} onSetPrimary={onSetPrimary} />);
    await user.click(screen.getAllByRole("button", { name: "Set primary" })[0] as HTMLElement);
    expect(onSetPrimary).toHaveBeenCalled();
  });

  it("renders empty state when no domains", () => {
    render(<DomainConfig domains={[]} />);
    expect(screen.getByText(/No domains yet/)).toBeInTheDocument();
  });
});
