# Copy / voice

Voice is **utility-first** for dashboard / settings / chat / auth surfaces. Marketing surfaces flex toward editorial / declarative voice. Both reject fluff.

---

## Universal rules

1. **Verbs over nouns** for actions.
2. **Specific over generic** for errors and confirmations.
3. **Concrete over aspirational** for descriptions.
4. **Sentence-case** for everything except `text-label-caps` eyebrows.
5. **No emojis** in component labels, button text, error messages, or markdown content authored by the system.
6. **No marketing fluff** on utility surfaces.

---

## Surface voice

### `cloud-dashboard` voice

Concrete, declarative, present tense. Sentences are short. Labels are verbs. Status is reported, not editorialized.

```
✓ "Manage your project deployments."
✗ "Take control of your deployment workflow!"

✓ "Build failed at step 4 of 7."
✗ "Oops! Something went wrong building your deployment."

✓ "Promote to production"  (button)
✗ "Make this deployment live!"

✓ "No deployments yet"  (empty state)
✗ "It's quiet here... too quiet."

✓ "Active deployments"  (StatTile label)
✗ "Live and kicking 🚀"
```

### `agent-chat` voice

User-controlled. The system's voice is the assistant's voice — UI chrome stays minimal and labels stay descriptive.

```
✓ "Send"  (button on composer)
✓ "Regenerate"  (button on assistant message)
✓ "Copy"  (action on code blocks)
✓ "Conversation was compacted"  (system notice)

✗ "Send it! 🚀"
✗ "Try again ✨"
✗ "Yay you copied! 🎉"
```

For tool calls and tool results, the labels are the tool name + status:

```
✓ "checkDeployment · ok"
✓ "writeFile · running"
✓ "queryDatabase · failed"

✗ "Working some magic..."
✗ "Doing the thing!"
```

### `settings-form` voice

Direct, hint-led for non-obvious settings. Save buttons say what's being saved.

```
✓ "Email"  (label)
✓ "Used for notifications and recovery."  (hint)
✓ "Save profile"  (button — names what saves)

✗ "Your email address goes here"  (label)
✗ "We'll use this to keep in touch!"  (hint)
✗ "Save changes"  (vague — what changes?)
```

For toggles, the label states the positive condition:

```
✓ "Two-factor authentication"  + helper "Require a code in addition to your password."
✗ "Enable 2FA?"
```

For destructive actions, the label states the irreversible action explicitly:

```
✓ "Delete account"
✓ "Transfer ownership"
✓ "Leave organization"

✗ "Are you sure?"
✗ "Yes I want to do this"
```

### `auth` voice

Minimum text. Reassurance over hype. No marketing.

```
✓ "Sign in to Theo"  (Card title)
✓ "Welcome back."  (description)
✓ "Sign in"  (button)

✓ "Create your account"
✓ "Sign up"

✗ "Welcome to the future of cloud deployment!"
✗ "Join 50,000+ teams shipping with Theo"  (invented metric)
```

For error states:

```
✓ "Invalid email or password."  (after sign-in failure — vague intentionally for security)
✓ "Code expired. Request a new one."  (after OTP expiry)
✓ "Email already in use."  (after sign-up collision)

✗ "Oops, that didn't work!"
✗ "Try again 🤔"
```

### `marketing` voice

The exception — editorial, declarative, period-terminated. Aggressive negative letter-spacing in the display tier reinforces the voice.

```
✓ "Build with confidence."  (hero — sentence case, period)
✓ "The cloud platform for AI-first applications."  (sub-hero)
✓ "Deploy in seconds. Scale automatically. Pay only for what you use."  (feature copy)

✗ "Build amazing apps faster than ever! ⚡"
✗ "Trusted by 50,000+ developers worldwide"  (invented metric)
✗ "The #1 deployment platform"  (invented superlative)
```

---

## Button labels

### Verb-led

```
✓ Save  Cancel  Continue  Submit
✓ Delete  Remove  Archive
✓ Sign in  Sign up  Sign out
✓ Connect  Disconnect
✓ Promote  Rollback  Redeploy
✓ Send  Reset  Verify
✓ Copy  Download  Export
✓ Open settings  Add member  Invite team
```

### Noun-led (only for navigation)

```
✓ Settings  Profile  Billing  Team  (in a nav bar)
```

### Banned phrasings

```
✗ Click here
✗ Learn more (when no target — use specific verb: "Read docs", "View pricing")
✗ Submit (too generic — name what's being submitted: "Send message", "Add deployment")
✗ Cancel (when context unclear — name what's being cancelled: "Cancel transfer", "Discard changes")
```

---

## Error messages

Every error must answer two questions:

1. **What happened?** Specific and concrete.
2. **What can the user do?** Next step explicit.

```tsx
// WRONG
<Alert variant="destructive">
  <Alert.Title>Something went wrong</Alert.Title>
</Alert>

// RIGHT
<Alert variant="destructive">
  <Alert.Title>Build failed: missing env var DATABASE_URL</Alert.Title>
  <Alert.Description>
    Add DATABASE_URL in the Environment settings, then redeploy.
  </Alert.Description>
</Alert>
```

For form validation errors:

```tsx
// WRONG
<p className="text-destructive">Invalid</p>

// RIGHT
<p className="text-destructive">Must be a valid email (e.g., user@example.com).</p>
```

For network / API errors:

```tsx
// WRONG
<Alert variant="destructive">
  <Alert.Title>Network error</Alert.Title>
</Alert>

// RIGHT
<Alert variant="destructive">
  <Alert.Title>Could not load deployments</Alert.Title>
  <Alert.Description>
    Network failed. Check your connection and try again.
  </Alert.Description>
</Alert>
```

---

## Empty states

Three components in `<EmptyState>`:

```tsx
<EmptyState
  icon={Rocket}
  title="No deployments yet"
  description="Connect a Git repo to deploy your first project."
  action={{ label: "Connect repo", onClick: openWizard }}
/>
```

### Title

State the empty condition. Verb-noun in present tense.

```
✓ "No deployments yet"
✓ "No projects to show"
✓ "No matching results"

✗ "Oops, it's empty!"
✗ "Nothing to see here"
✗ "We couldn't find anything 😭"
```

### Description

Tell the user how to populate. One sentence.

```
✓ "Connect a Git repo to deploy your first project."
✓ "Try adjusting your filters."  (when filtering returned 0)
✓ "Invite team members to collaborate."

✗ "Add some data to see it here."
✗ "Get started by clicking the button below."
✗ "Your projects will appear here once you create some."
```

### Action

Single CTA, verb-led, specific.

```
✓ "Connect repo"
✓ "Clear filters"
✓ "Invite team"

✗ "Get started"
✗ "Click here"
✗ "Add"
```

---

## Confirmation copy

`<ConfirmDialog>` requires three pieces:

```tsx
<ConfirmDialog
  title="Delete deployment?"
  description="This will permanently remove the deployment and its build artifacts. This cannot be undone."
  confirmLabel="Delete deployment"
  variant="destructive"
  onConfirm={handleDelete}
>
  <Button variant="destructive">Delete</Button>
</ConfirmDialog>
```

### Title

Question form, ends with `?`. States the action + the object.

```
✓ "Delete deployment?"
✓ "Rollback to v1.2.0?"
✓ "Transfer ownership?"
✓ "Drop database table?"

✗ "Confirm action"
✗ "Are you sure?"  (vague — sure about what?)
✗ "WARNING!!!"
```

### Description

Two sentences max:

1. What will happen
2. Whether it's reversible / how

```
✓ "This will permanently remove the deployment and its build artifacts. This cannot be undone."
✓ "Production traffic will redirect to v1.2.0. You can rollback again at any time."
✓ "The new owner gets full admin access. You'll lose the ability to make admin changes."

✗ "Are you really sure you want to do this?"
✗ "This is a destructive action."  (too vague)
```

### Confirm label

Restate the action. Same verb as the title.

```
✓ "Delete deployment"
✓ "Rollback"
✓ "Transfer"
✓ "Drop table"

✗ "OK"
✗ "Yes"
✗ "Confirm"
```

For high-stakes actions, require a text match:

```tsx
<ConfirmDialog
  title="Delete organization?"
  description={`Type "${orgName}" to confirm deletion.`}
  confirmLabel="Delete organization"
  variant="destructive"
  requireTextMatch={orgName}
  onConfirm={deleteOrg}
>
  <Button variant="destructive">Delete organization</Button>
</ConfirmDialog>
```

---

## Hint text

Hint text appears below form inputs in `text-body-sm text-muted-foreground`. Use it to:

- Explain a non-obvious format requirement.
- Clarify what a field is for.
- Indicate optional vs. required.

```tsx
✓ <p className="text-body-sm text-muted-foreground">8+ characters, mixed case, one number.</p>
✓ <p className="text-body-sm text-muted-foreground">Used for notifications and recovery.</p>
✓ <p className="text-body-sm text-muted-foreground">Optional. Visible to your team only.</p>

✗ <p>Please enter a valid value</p>  (no info)
✗ <p>This field is required</p>  (just use the `required` attribute)
```

---

## Toast / inline alert copy

Toasts auto-dismiss. Inline alerts stay until dismissed. Use:

- **Toast** for routine successes (saved, copied, sent).
- **Inline `<Alert>`** for cross-field validation errors or page-level states.

```tsx
// Toast
toast.success("Settings saved")
toast.success("Invitation sent to user@example.com")

// Inline alert
<Alert variant="destructive">
  <Alert.Title>Could not save settings</Alert.Title>
  <Alert.Description>Your session expired. Please sign in again.</Alert.Description>
</Alert>
```

### Banned toast copy

```
✗ "Success! 🎉"
✗ "Great job!"
✗ "Awesome, we got that for you!"
```

---

## Pluralization

Use `Intl.PluralRules` for correctness. Don't write `"1 deployments"`:

```tsx
const formatter = new Intl.PluralRules("en-US");
const count = items.length;
const label = formatter.select(count) === "one"
  ? `${count} deployment`
  : `${count} deployments`;
```

For most cases, a simple `count === 1 ? "X" : "Xs"` works. Use the Intl API for languages with multiple plural forms (`zero`, `one`, `two`, `few`, `many`, `other`).

---

## Date and time

Theo-ui ships `<Timestamp>` — use it:

```tsx
<Timestamp date={deployment.createdAt} />
// Renders: "2 hours ago" with tooltip showing absolute timestamp
```

Don't roll your own date formatting. The primitive handles relative + absolute + tooltip + locale.

For free-form dates in copy, format as:

```
Today  ·  Yesterday  ·  Last week  ·  Mar 15
```

NOT:

```
2 days ago  (vague past 24h)
1 week ago  (vague past month)
"03/15/2026"  (locale-ambiguous)
```

---

## Numbers

```tsx
// Counts
{users.toLocaleString()}  // "1,234"

// Currency
{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)}  // "$12.34"

// Bytes (use a helper)
formatBytes(bytesValue)  // "1.2 GB"

// Percentages
{percentage.toFixed(1)}%  // "47.3%"
```

In `<StatTile>`, set `valueFormat` for built-in formatting:

```tsx
<StatTile label="Storage" value={147_000_000} valueFormat="bytes" />
// Renders: "147 MB"

<StatTile label="Revenue" value={12345.67} valueFormat="currency" />
// Renders: "$12,345.67"

<StatTile label="Success rate" value={0.987} valueFormat="percent" />
// Renders: "98.7%"
```

---

## Accessibility copy

### `aria-label` for icon-only buttons

```tsx
<Button variant="ghost" size="icon" aria-label="Open settings">
  <Settings className="h-4 w-4" />
</Button>
```

Without `aria-label`, screen readers announce the icon's SVG title (or nothing). Always set it.

### `<VisuallyHidden>` for context-only text

For text that's only useful to screen readers (e.g., "Status:" before a `<StatusDot>`), use `<VisuallyHidden>`:

```tsx
<VisuallyHidden>Status:</VisuallyHidden>
<StatusDot variant="success" />
<span>Active</span>
```

### Form label pairing

```tsx
✓ <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />

✗ <p>Email</p>
  <Input type="email" />
```

The `<Label>` primitive handles `htmlFor` association + clickable label.
