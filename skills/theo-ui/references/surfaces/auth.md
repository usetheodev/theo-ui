# Surface — auth

Sign-in, sign-up, OTP verification, password reset, OAuth callback, magic link. Auth is a **high-stakes, narrow-flow, single-purpose** surface. The user is converting (signing up) or returning (signing in) — every element on the page must serve that flow.

---

## When this surface applies

The brief mentions any of:

- sign in / login / log in
- sign up / register / create account
- OTP / one-time password / verification code / 2FA / two-factor
- password reset / forgot password / recovery
- OAuth / social auth / Google / GitHub / Apple
- magic link / passwordless / email link
- account verification / email confirmation

If the brief is *"build a sign-in page"* / *"OTP verify screen"* / *"OAuth callback"* — this surface.

---

## Anchor composites

| Composite | When to use |
|---|---|
| `<LoginSplit>` | Two-column auth layout: form on one side, branding/illustration on the other. The canonical Vercel/Clerk-style sign-in. |
| `<SocialAuthRow>` | OAuth provider buttons (Google, GitHub, Apple, etc.) — rendered as a labeled row. |

---

## Primitives commonly used

| Primitive | Role |
|---|---|
| `<Card>` | Centered single-column auth (alternative to `<LoginSplit>`). |
| `<Input>` | Email, password, code inputs. |
| `<Button>` | Primary submit, secondary cancel, ghost provider buttons inside `<SocialAuthRow>`. |
| `<Label>` | Always paired with inputs. |
| `<Alert>` | Inline error / success. |
| `<PinInput>` | OTP / verification code multi-slot input. (Post-0.11, Brief #5.) |
| `<Checkbox>` | "Remember me", "Agree to terms". |
| `<Avatar>` | Account selector after sign-in. |
| `<Badge>` | Plan indicator post-signup. |

---

## Layout

Two canonical patterns:

### P10a · LoginSplit (preferred for marketing-aware brands)

```tsx
<LoginSplit
  branding={{
    title: "Theo",
    tagline: "The cloud platform for AI-first apps.",
    background: <GradientMesh />,  // optional decoration
  }}
>
  <SignInForm />
</LoginSplit>
```

Internal structure: 50/50 split on `lg`+, single-column on `md` and below. Form takes the left column, branding takes the right.

### P10b · Centered Card

```tsx
<div className="min-h-screen flex items-center justify-center px-4 bg-background">
  <Card className="w-full max-w-md">
    <Card.Header className="text-center">
      <Card.Title className="text-title-lg">Sign in to Theo</Card.Title>
      <Card.Description>Welcome back.</Card.Description>
    </Card.Header>
    <Card.Content>
      <SignInForm />
    </Card.Content>
  </Card>
</div>
```

Single Card, centered. The right pattern for utilitarian auth (admin panels, internal tools) or when the brand wants the auth flow to feel like an extension of the app, not the marketing site.

---

## Density

`auth` defaults to `comfortable`. Don't switch — auth surfaces benefit from generous tap targets even on dense layouts. Sign-in flows are click-heavy; missed clicks compound friction.

---

## Sign-in form

```tsx
function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

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
          <a href="/reset" className="text-body-sm text-primary hover:underline">
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

      <SocialAuthRow
        providers={["google", "github", "apple"]}
        onProviderClick={handleOAuth}
        label="Or continue with"
      />

      <p className="text-center text-body-sm text-muted-foreground">
        Don't have an account?{" "}
        <a href="/signup" className="text-primary hover:underline">Sign up</a>
      </p>
    </form>
  );
}
```

### Rules

- **`autoComplete` on every field**. `email`, `current-password`, `new-password`, `one-time-code`. Browsers + password managers expect these.
- **`required` on every field that's required**. The browser default form-validation message is fine for first-pass — server-side errors override.
- **Primary button is `size="lg"` and `className="w-full"`**. Auth forms are touch-first.
- **Loading state on submit button**, not on the whole form. The form stays interactive; only the submit pulse-loads.
- **Inline `<Alert variant="destructive">` at the top** for auth failures. Don't inline-error each field for "Wrong credentials" — the server doesn't know which.
- **Forgot password link inline with the password label**. Don't put it as a separate Link below the form.

---

## OAuth row

`<SocialAuthRow>` renders provider buttons. Default layout: horizontal row at desktop, stacked vertical at mobile.

```tsx
<SocialAuthRow
  providers={["google", "github", "apple"]}
  onProviderClick={(provider) => signInWithProvider(provider)}
  label="Or continue with"
  layout="horizontal"  // or "vertical"
/>
```

The label appears as a divider: `<separator>Or continue with<separator>`. The provider buttons render with the official logo icon (lucide-react has them) and a neutral label like "Google" / "GitHub" / "Apple".

### Provider button rules

- **Use the official logo color or monochrome** — don't paint GitHub purple. Pure black or theme `foreground` is the safe default.
- **Order: most-used first**. For B2C apps, Google → Apple → GitHub. For dev tools, GitHub → Google → others.
- **3 providers max in the primary row**. More providers go into a "More options" dropdown.

---

## Sign-up form

Same structure as sign-in plus:

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Full name</Label>
  <Input id="name" autoComplete="name" required value={name} onChange={...} />
</div>

<div className="space-y-2">
  <Label htmlFor="email">Work email</Label>
  <Input id="email" type="email" autoComplete="email" required value={email} onChange={...} />
</div>

<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={...} />
  <p className="text-body-sm text-muted-foreground">8+ characters, mixed case, one number.</p>
</div>

<div className="flex items-start gap-2">
  <Checkbox id="terms" required />
  <Label htmlFor="terms" className="text-body-sm font-normal">
    I agree to the <a href="/terms" className="text-primary hover:underline">Terms</a> and{" "}
    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
  </Label>
</div>

<Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
  Create account
</Button>
```

### Rules

- **`autoComplete="new-password"`** on signup password (vs `current-password` on signin). Triggers password-manager prompt to save.
- **Password requirements as hint** below the field. Not as a real-time validation list (that's friction).
- **Terms checkbox is required**. Don't pre-check it (compliance issue).
- **Primary CTA label**: "Create account" — verb + concrete object. Not "Submit". Not "Sign up". Not "Get started" (that's marketing speak).

---

## OTP / verification code

Use `<PinInput>` (Brief #5):

```tsx
function VerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleComplete(value: string) {
    setVerifying(true);
    setError(null);
    try {
      await verifyCode(value);
    } catch (err) {
      setError("Invalid code. Try again.");
      setCode("");  // reset on error
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <Card.Header className="text-center">
          <Card.Title>Verify your email</Card.Title>
          <Card.Description>
            We sent a 6-digit code to <span className="font-mono">user@example.com</span>.
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
            <button onClick={resend} className="text-primary hover:underline">
              Resend
            </button>
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
```

### Rules

- **`<PinInput>` not 6 `<Input>` elements**. The primitive handles auto-advance, paste, backspace, arrow nav, mask, error state.
- **`inputMode="numeric"`** for numeric codes — triggers mobile numeric keyboard.
- **`onComplete` fires once** when the value reaches `length`. Don't manually check length in `onChange`.
- **Reset code on error** — clear the value, focus the first slot.
- **Resend link below the input**, not as a separate button. Lowest-priority action.

---

## Password reset flow

Two screens:

### 1. Request reset

```tsx
<Card>
  <Card.Header className="text-center">
    <Card.Title>Reset your password</Card.Title>
    <Card.Description>
      We'll send a reset link to your email.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form onSubmit={requestReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={...} />
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
        Send reset link
      </Button>
    </form>
  </Card.Content>
</Card>
```

### 2. Confirmation (post-submit)

```tsx
<Card>
  <Card.Header className="text-center">
    <Card.Title>Check your email</Card.Title>
    <Card.Description>
      If an account exists for <span className="font-mono">{email}</span>, you'll receive a reset link shortly.
    </Card.Description>
  </Card.Header>
  <Card.Footer>
    <Button variant="ghost" asChild className="w-full">
      <a href="/signin">Back to sign in</a>
    </Button>
  </Card.Footer>
</Card>
```

**Important** — the confirmation message uses "If an account exists for X" wording, NOT "We sent an email to X". This prevents account enumeration (an attacker can't probe whether an email is registered).

---

## A11y essentials

- Every field has `<Label htmlFor>`.
- `autoComplete` attributes on every field.
- `required` attribute where applicable.
- Submit button gets `loading` prop (theo-ui `<Button>`) which disables + shows spinner.
- Error alerts are `role="alert"` (handled by `<Alert variant="destructive">`).
- `<PinInput>` has `aria-label`.
- Forgot/Reset/Resend buttons are `<button>` or `<a>` with visible focus rings.
- Form has `<form onSubmit>` — Enter key submits.

---

## Anti-patterns specific to auth

- **Hand-rolled OTP input** with 6 `<Input>`s and manual focus management. Use `<PinInput>`.
- **Hand-rolled OAuth buttons** with provider-color backgrounds. Use `<SocialAuthRow>`.
- **Account enumeration in reset flow** — "We sent an email to X" leaks that X is registered. Use "If an account exists for X".
- **Password requirements as a real-time validation list** — friction. Show as hint text. Server-side validation catches the actual rules.
- **Pre-checked terms checkbox** — compliance issue (GDPR, CCPA). Always require explicit opt-in.
- **Submit button below the OAuth row** — the OAuth row goes BELOW the submit (after the primary path).
- **No `autoComplete`** — password managers fail silently. Always set.
- **Marketing fluff in auth copy** — *"Welcome back to the future of …"* — banned. Concrete + utility.
