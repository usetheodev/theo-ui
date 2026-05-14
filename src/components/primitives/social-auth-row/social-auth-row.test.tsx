import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Github, Mail } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { SocialAuthRow, type SocialProvider } from "./social-auth-row.js";

const providers: SocialProvider[] = [
  { id: "github", label: "Continue with GitHub", icon: Github },
  { id: "email", label: "Continue with Email", icon: Mail },
];

describe("SocialAuthRow", () => {
  it("renders a button for each provider", () => {
    render(<SocialAuthRow providers={providers} />);
    expect(screen.getByRole("button", { name: /GitHub/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Email/ })).toBeInTheDocument();
  });

  it("fires onSelect with the provider id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SocialAuthRow providers={providers} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /GitHub/ }));
    expect(onSelect).toHaveBeenCalledWith("github");
  });
});
