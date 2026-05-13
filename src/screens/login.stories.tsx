import type { Story } from "@ladle/react";
import { Github, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/primitives/button/button.js";
import { Input } from "../components/primitives/input/input.js";
import { LoginSplit } from "../components/primitives/login-split/login-split.js";
import { SocialAuthRow } from "../components/primitives/social-auth-row/social-auth-row.js";

export default { title: "Screens / Login Split" };

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <title>Google</title>
    <path d="M12 11v3.4h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 4 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.7-3.7 8.7-8.9 0-.6-.1-1.1-.2-1.6L12 11z" />
  </svg>
);

export const Default: Story = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="-m-12">
      <LoginSplit
        footer="© 2026 Theo. Forged for builders."
        left={
          <div className="grid gap-8">
            <header className="grid gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-primary font-black font-display text-primary-foreground">
                T
              </span>
              <h1 className="font-display text-display-md tracking-tight">Welcome back.</h1>
              <p className="text-body-md text-muted-foreground">
                Log in to your creative workspace to continue building.
              </p>
            </header>
            <SocialAuthRow
              vertical
              providers={[
                { id: "google", label: "Continue with Google", icon: GoogleIcon },
                { id: "github", label: "Continue with GitHub", icon: Github },
              ]}
            />
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="h-px flex-1 bg-border/40" />
              <span className="font-mono text-label-caps uppercase tracking-wider">or email</span>
              <span className="h-px flex-1 bg-border/40" />
            </div>
            <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-1.5">
                <label
                  htmlFor="email"
                  className="font-sans text-label text-muted-foreground uppercase"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@usetheo.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="font-sans text-label text-muted-foreground uppercase"
                  >
                    Password
                  </label>
                  <a
                    className="font-mono text-label text-primary hover:underline"
                    // biome-ignore lint/a11y/useValidAnchor: mockup link
                    href="#"
                  >
                    Forgot password
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                <Mail /> Sign in
              </Button>
              <p className="text-center text-body-sm text-muted-foreground">
                Don't have an account?{" "}
                <a
                  // biome-ignore lint/a11y/useValidAnchor: mockup link
                  href="#"
                  className="text-primary hover:underline"
                >
                  Create account
                </a>
              </p>
            </form>
          </div>
        }
        right={
          <div className="grid gap-4 text-center">
            <h2 className="font-black font-display text-display-lg text-foreground tracking-tight">
              DESIGN <span className="text-accent">LAB</span>
            </h2>
            <div className="relative mx-auto grid h-72 w-full max-w-sm place-items-center rounded-2xl border border-primary/30 bg-card shadow-glow">
              <div className="absolute inset-0 m-6 rounded-xl border border-border/40 border-dashed" />
              <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
                [3D illustration]
              </span>
            </div>
            <div className="grid gap-1 rounded-xl border border-border/40 bg-card p-4 text-left">
              <p className="font-display text-title-md">Engineered for Precision</p>
              <p className="text-body-sm text-muted-foreground">
                The Violet Forge design system delivers a confident, premium aesthetic for modern
                technical platforms.
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
};
