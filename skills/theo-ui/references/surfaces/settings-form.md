# Surface — settings-form

Configuration surfaces: account settings, team settings, project settings, preference panels, billing setup, profile editing, integration setup. The surface vocabulary is **form-heavy, save-state-aware, opt-in-grouped** — the user is configuring, not browsing.

---

## When this surface applies

The brief mentions any of:

- settings / preferences / configuration
- profile / account / team / organization
- form / fields / input / select / toggle
- billing setup / plan change / payment method
- integration / connection / webhook / API key
- danger zone / delete account / leave organization

If the brief is *"build a settings page"* / *"team management UI"* / *"integration config flow"* — this surface.

---

## Anchor composites

| Composite | When to use |
|---|---|
| `<PageShell>` | Every settings page. Standard header + state machine. |
| `<Card>` | Each settings group. Stack vertically. One concern per card. |
| `<DangerZone>` | Final card at the bottom — destructive settings (delete account, leave org). |
| `<EnvVarEditor>` | When env vars are part of the settings (project settings). |
| `<DomainConfig>` | When domain settings are part of the page. |
| `<UsageMeter>` | Billing usage / quota displays. |
| `<ConfirmDialog>` | Destructive confirmations (delete, leave, drop). |

---

## Primitives commonly used

| Primitive | Role |
|---|---|
| `<Input>` | Text, email, URL, number inputs. |
| `<Textarea>` | Multi-line text (descriptions, notes). |
| `<Select>` | Dropdown picker. |
| `<Switch>` | Boolean toggle (preferences, feature flags). |
| `<Checkbox>` | Multi-select / agree-to-X. |
| `<RadioGroup>` | Exclusive choice from a small set. |
| `<Label>` | Always paired with form controls. |
| `<Slider>` | Numeric range picker. |
| `<Button>` | Save, Cancel, Submit. |
| `<Alert>` | Inline warnings / saved confirmations. |
| `<Badge>` | Plan tier, role labels, status. |
| `<CopyButton>` | API keys, webhook URLs. |
| `<AvatarUpload>` | Profile picture upload. |
| `<Avatar>` | Display avatars in team lists. |

---

## Layout

The canonical settings layout is **PageShell + stack of Cards + DangerZone at the bottom**:

```tsx
<PageShell title="Account settings" description="Manage your profile and preferences.">
  <div className="space-y-6 max-w-3xl">
    <Card>
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>Your public identity across the platform.</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <FormField label="Display name" htmlFor="name">
          <Input id="name" value={name} onChange={...} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={...} />
        </FormField>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" onClick={saveProfile} loading={isSaving}>Save profile</Button>
      </Card.Footer>
    </Card>

    <Card>
      <Card.Header>
        <Card.Title>Notifications</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-4">
        <ToggleField label="Email notifications" checked={emailEnabled} onChange={...} />
        <ToggleField label="Push notifications" checked={pushEnabled} onChange={...} />
      </Card.Content>
    </Card>

    <DangerZone
      title="Delete account"
      description="Permanently remove your account and all associated data."
      action={
        <ConfirmDialog ...>
          <Button variant="destructive">Delete account</Button>
        </ConfirmDialog>
      }
    />
  </div>
</PageShell>
```

### Layout rules

- **`max-w-3xl`** (768 px) on the content stack. Settings pages are single-column reading surfaces — don't stretch to the page-wide container.
- **`space-y-6`** between Cards. 24 px gap is the Vercel-aligned rhythm.
- **One concern per Card.** Profile / Notifications / Security / Billing / API Keys / etc. Don't pile 8 unrelated settings into one Card.
- **DangerZone always last.** Visual + semantic separation.

---

## Density

`settings-form` defaults to `comfortable` (36 px controls). Switch to `compact` for:

- Admin panels with many fields per Card.
- Multi-step configuration wizards where vertical space is constrained.

Spacious is right for accessibility-first interfaces.

---

## Form patterns

### FormField helper (locally defined)

Theo-ui doesn't ship a `<FormField>` composite — most projects define one. The canonical pattern:

```tsx
function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-body-sm text-destructive">{error}</p>}
      {!error && hint && <p className="text-body-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
```

### ToggleField

```tsx
function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
```

### Save patterns

**Per-Card save** (preferred for long settings pages):

```tsx
<Card>
  <Card.Header>
    <Card.Title>Profile</Card.Title>
  </Card.Header>
  <Card.Content>
    {/* fields */}
  </Card.Content>
  <Card.Footer className="flex justify-end gap-2">
    <Button variant="ghost" onClick={resetProfile}>Cancel</Button>
    <Button variant="primary" onClick={saveProfile} loading={isSaving}>Save</Button>
  </Card.Footer>
</Card>
```

**Sticky save bar** (rare — only for short single-Card settings):

```tsx
<PageShell title="Settings">
  <Card>
    <Card.Content>{/* all fields */}</Card.Content>
  </Card>
  <div className="sticky bottom-0 bg-background border-t border-border py-4 mt-6 flex justify-end gap-2">
    <Button variant="ghost" onClick={reset}>Cancel</Button>
    <Button variant="primary" onClick={save}>Save changes</Button>
  </div>
</PageShell>
```

**Auto-save** (Linear-style):

```tsx
<ToggleField
  label="Two-factor authentication"
  checked={twofaEnabled}
  onChange={(v) => {
    setTwofaEnabled(v);
    saveSetting("twofa", v);  // fire-and-forget with optimistic UI
  }}
/>
```

For auto-save, surface success silently (no toast — the toggle is the feedback). Surface failure with `<Alert variant="destructive">` inline + revert the toggle state.

---

## Validation

Inline error messages below the field. `<Alert>` at the top of the Card for cross-field errors.

```tsx
<Card>
  {formError && (
    <Card.Content>
      <Alert variant="destructive">
        <Alert.Title>Could not save changes</Alert.Title>
        <Alert.Description>{formError}</Alert.Description>
      </Alert>
    </Card.Content>
  )}
  <Card.Content className="space-y-4">
    <FormField
      label="Domain"
      htmlFor="domain"
      error={errors.domain}
      hint="Must be a valid hostname."
    >
      <Input id="domain" value={domain} onChange={...} />
    </FormField>
  </Card.Content>
</Card>
```

### Validation timing

- **On blur**: validate the field, show error.
- **On submit**: validate all fields, focus the first invalid one.
- **On change**: debounce by 500 ms before validating to avoid flicker.

---

## Destructive actions

Always in `<DangerZone>` at the bottom of the page:

```tsx
<DangerZone>
  <DangerZone.Action
    title="Transfer ownership"
    description="Make another team member the owner of this organization."
    action={
      <ConfirmDialog
        title="Transfer ownership?"
        description="You will lose admin access to this organization."
        confirmLabel="Transfer"
        variant="destructive"
        onConfirm={transferOwnership}
      >
        <Button variant="destructive" size="sm">Transfer</Button>
      </ConfirmDialog>
    }
  />
  <DangerZone.Action
    title="Delete organization"
    description="Permanently delete the organization and all data. This cannot be undone."
    action={
      <ConfirmDialog
        title="Delete organization?"
        description={`Type "${orgName}" to confirm.`}
        confirmLabel="Delete organization"
        variant="destructive"
        requireTextMatch={orgName}
        onConfirm={deleteOrg}
      >
        <Button variant="destructive" size="sm">Delete organization</Button>
      </ConfirmDialog>
    }
  />
</DangerZone>
```

For genuinely irreversible actions, `<ConfirmDialog>` should require typing the entity name (`requireTextMatch` prop). This is the Vercel / Linear / Stripe pattern.

---

## A11y essentials

- Every `<Input>` has a paired `<Label htmlFor>`.
- `<Switch>` and `<Checkbox>` have associated `<Label>` (clicking the label toggles).
- Error messages are `aria-describedby` linked to the field via `aria-invalid`.
- Submit buttons disabled while submitting (handled by `loading` prop).
- DangerZone actions still have keyboard nav and focus rings.

---

## Composition examples

### Account settings page

```tsx
<PageShell title="Account" description="Manage your profile and security settings.">
  <div className="space-y-6 max-w-3xl">
    <Card>
      <Card.Header>
        <Card.Title>Profile</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={avatar} alt={name} size="lg" />
          <Button variant="secondary" size="sm">Change photo</Button>
        </div>
        <FormField label="Display name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Email" htmlFor="email" hint="Used for notifications and recovery.">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" onClick={save} loading={isSaving}>Save profile</Button>
      </Card.Footer>
    </Card>

    <Card>
      <Card.Header>
        <Card.Title>Notifications</Card.Title>
        <Card.Description>Choose what you want to hear about.</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <ToggleField
          label="Product updates"
          description="New features, improvements, and changelog highlights."
          checked={updates}
          onChange={setUpdates}
        />
        <ToggleField
          label="Security alerts"
          description="Sign-ins from new devices, password changes."
          checked={security}
          onChange={setSecurity}
        />
      </Card.Content>
    </Card>

    <DangerZone>
      <DangerZone.Action
        title="Delete account"
        description="Permanently delete your account and all associated data."
        action={
          <ConfirmDialog ...>
            <Button variant="destructive" size="sm">Delete account</Button>
          </ConfirmDialog>
        }
      />
    </DangerZone>
  </div>
</PageShell>
```

### Project environment variables

```tsx
<PageShell title="Environment variables" description={`Variables for ${project.name}.`}>
  <Card>
    <Card.Header>
      <Card.Title>Variables</Card.Title>
      <Card.Description>
        Encrypted at rest. Available at build time and runtime.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <EnvVarEditor
        variables={vars}
        onAdd={addVar}
        onUpdate={updateVar}
        onDelete={deleteVar}
      />
    </Card.Content>
  </Card>
</PageShell>
```

---

## Anti-patterns specific to settings-form

- **Mixing concerns in one Card** — Profile + Notifications + Security all stuffed into one giant Card. Split them.
- **No DangerZone** — destructive actions scattered through the page instead of grouped at the bottom.
- **Manual confirmation dialogs** — use `<ConfirmDialog>` with `requireTextMatch` for high-stakes.
- **Auto-save without feedback** — silent success is fine, but silent failure isn't. Show inline alert on failure.
- **Save button outside the Card** — Save belongs in `<Card.Footer>`, scoped to the Card's fields.
- **Multi-column form layouts on settings** — single-column with `max-w-3xl` is the right rhythm. Multi-column belongs on dashboards, not settings.
- **Switching between Switch and Checkbox arbitrarily** — Switch for preferences/toggles; Checkbox for "agree to X" / multi-select. Don't mix.
