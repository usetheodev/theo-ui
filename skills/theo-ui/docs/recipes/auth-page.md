# Recipe — Sign-in + OTP verify

Worked examples of P10 SignInPage and P11 OTPVerifyPage.

---

## Brief

> "Build a sign-in flow with email/password + OAuth (Google, GitHub) + magic link option. After password sign-in, route to OTP verify for 2FA users."

---

## Step 6 — Build: Sign-in page

```tsx
{/* theo-ui · archetype: P10 SignInPage · surface: auth · density: comfortable
 *  composites: LoginSplit · SocialAuthRow
 *  primitives: Card · Input · Label · Button · Alert · Checkbox
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA pass + autoComplete + required
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
"use client";

import { useState, type FormEvent } from "react";

import { LoginSplit } from "@usetheo/ui/login-split";
import { SocialAuthRow } from "@usetheo/ui/social-auth-row";
import { Card } from "@usetheo/ui/card";
import { Input } from "@usetheo/ui/input";
import { Label } from "@usetheo/ui/label";
import { Button } from "@usetheo/ui/button";
import { Alert } from "@usetheo/ui/alert";

import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const { signInWithPassword, signInWithOAuth, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPassword(email, password);
      if (result.requires2FA) {
        window.location.href = "/auth/verify";
      } else {
        window.location.href = "/projects";
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    try {
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <LoginSplit branding={{ title: "Theo", tagline: "Cloud platform for AI-first apps." }}>
        <Card className="w-full max-w-md">
          <Card.Header className="text-center">
            <Card.Title>Check your email</Card.Title>
            <Card.Description>
              If an account exists for <span className="font-mono">{email}</span>, you'll receive a sign-in link shortly.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button variant="ghost" onClick={() => setMagicLinkSent(false)} className="w-full">
              Back to sign in
            </Button>
          </Card.Footer>
        </Card>
      </LoginSplit>
    );
  }

  return (
    <LoginSplit
      branding={{
        title: "Theo",
        tagline: "Cloud platform for AI-first apps.",
      }}
    >
      <Card className="w-full max-w-md">
        <Card.Header className="text-center">
          <Card.Title>Sign in to Theo</Card.Title>
          <Card.Description>Welcome back.</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="/auth/reset" className="text-body-sm text-primary hover:underline">
                  Forgot?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={handleMagicLink}
            disabled={loading || email === ""}
          >
            Sign in with magic link
          </Button>

          <SocialAuthRow
            providers={["google", "github"]}
            onProviderClick={(p) => signInWithOAuth(p)}
            label="Or continue with"
          />

          <p className="text-center text-body-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-primary hover:underline">Sign up</a>
          </p>
        </Card.Content>
      </Card>
    </LoginSplit>
  );
}
```

---

## Step 6 — Build: OTP verify page

```tsx
{/* theo-ui · archetype: P11 OTPVerifyPage · surface: auth · density: comfortable
 *  composites: Card
 *  primitives: PinInput · Button · Alert
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA + aria-label on PinInput
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
"use client";

import { useState } from "react";

import { Card } from "@usetheo/ui/card";
import { PinInput } from "@usetheo/ui/pin-input";
import { Button } from "@usetheo/ui/button";
import { Alert } from "@usetheo/ui/alert";

import { useAuth } from "@/hooks/useAuth";

export default function VerifyPage() {
  const { verifyOTP, resendOTP, pendingEmail } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleComplete(value: string) {
    setVerifying(true);
    setError(null);
    try {
      await verifyOTP(value);
      window.location.href = "/projects";
    } catch (err: any) {
      setError(err.message || "Invalid code. Try again.");
      setCode("");  // reset on error
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    await resendOTP();
    // (toast for success — handled by useAuth)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <Card.Header className="text-center">
          <Card.Title>Verify your email</Card.Title>
          <Card.Description>
            We sent a 6-digit code to{" "}
            <span className="font-mono">{pendingEmail}</span>.
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}

          <PinInput
            length={6}
            value={code}
            onChange={setCode}
            onComplete={handleComplete}
            disabled={verifying}
            inputMode="numeric"
            aria-label="6-digit verification code"
            error={!!error}
          />

          <p className="text-center text-body-sm text-muted-foreground">
            Didn't get the code?{" "}
            <button
              onClick={handleResend}
              className="text-primary hover:underline"
            >
              Resend
            </button>
          </p>

          {verifying && (
            <p className="text-center text-body-sm text-muted-foreground">Verifying…</p>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
```

---

## Step 7 — Slop test (sign-in)

| Gate | Result |
|---|---|
| L-01–L-06 | PASS |
| T-01–T-08 | PASS |
| A-04 Label htmlFor | PASS — email and password both paired |
| A-01 focus-visible | PASS — theo-ui primitives ship rings |
| R-01–R-04 | PASS |
| V-01 | PASS — no invented metrics |
| V-02 | PASS — buttons are verbs ("Sign in", "Sign up", "Forgot?") |
| V-04 | PASS — error vague intentionally for security |
| **AU-01** LoginSplit | PASS |
| **AU-02** SocialAuthRow | PASS — no hand-rolled provider buttons |
| **AU-03** Account-enumeration safe | PASS — "If an account exists for X" wording |

## Slop test (OTP verify)

| Gate | Result |
|---|---|
| L-01–L-06 | PASS |
| T-01–T-08 | PASS |
| A-01 focus-visible | PASS — PinInput auto-advances and rings |
| R-01–R-04 | PASS — Card max-w-md fits all breakpoints |
| V-02 | PASS — "Resend" is verb |
| **AU-03** PinInput not hand-rolled | PASS |

**Both pages: 32 / 32 + AU-extensions ✓**

---

## Handoff

```
Build complete:
- src/app/auth/signin/page.tsx (147 lines)
- src/app/auth/verify/page.tsx (78 lines)

Next steps:
- Wire useAuth() to your real auth provider (NextAuth, Clerk, Supabase, custom).
- Add /auth/signup with the same shape — replace `current-password` with `new-password`, add `name` field, add terms checkbox.
- Add /auth/reset for password reset (P10 + Card-only variant).
- For social provider icons, lucide-react has Google + GitHub + Apple. SocialAuthRow handles the layout.
```
