# Recipe — Settings page

A worked example of the default verb building a P3 SettingsPage with profile + notifications + danger zone.

---

## Brief

> "Build the account settings page. Users edit their profile (name, email, avatar), toggle notification preferences (product updates, security alerts), and have a danger zone for deleting the account."

---

## Step 1 — Design-context gate

User: *"go ahead"*

Inferred: surface=settings-form · use=update account preferences · density=comfortable.

---

## Step 2 — Archetype

> *"Surface: settings-form. Archetype: P3 SettingsPage. Anchor: PageShell + stacked Card + DangerZone."*

---

## Step 5 — Preview

```markdown
**theo-ui · v1.0.0**

- **Surface** · settings-form
- **Archetype** · P3 SettingsPage
- **Anchor composite** · PageShell + Card stack + DangerZone
- **Components used** · PageShell · Card · Input · Switch · Label · Button · Avatar · DangerZone · ConfirmDialog · Alert
- **Theme** · violet-forge
- **Density** · comfortable
- **Imports** · subpath
- **Slop test** · 32 / 32 + SF-01/02/03 ✓
```

---

## Step 6 — Build

```tsx
{/* theo-ui · archetype: P3 SettingsPage · surface: settings-form · density: comfortable
 *  composites: PageShell · Card · DangerZone · ConfirmDialog
 *  primitives: Input · Switch · Label · Button · Avatar · Alert
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA pass
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
"use client";

import { useId, useState, type FormEvent } from "react";

import { PageShell } from "@usetheo/ui/page-shell";
import { Card } from "@usetheo/ui/card";
import { Input } from "@usetheo/ui/input";
import { Switch } from "@usetheo/ui/switch";
import { Label } from "@usetheo/ui/label";
import { Button } from "@usetheo/ui/button";
import { Avatar } from "@usetheo/ui/avatar";
import { Alert } from "@usetheo/ui/alert";
import { DangerZone } from "@usetheo/ui/danger-zone";
import { ConfirmDialog } from "@usetheo/ui/confirm-dialog";

import { useAccount } from "@/hooks/useAccount";

export default function AccountSettingsPage() {
  const { user, updateProfile, updateNotifications, deleteAccount, isSaving, error } = useAccount();

  return (
    <PageShell
      title="Account"
      description="Manage your profile and notification preferences."
    >
      <div className="space-y-6 max-w-3xl">
        <ProfileCard user={user} onSave={updateProfile} isSaving={isSaving} error={error} />
        <NotificationsCard user={user} onUpdate={updateNotifications} />
        <DangerZone>
          <DangerZone.Action
            title="Delete account"
            description="Permanently remove your account and all associated data. This cannot be undone."
            action={
              <ConfirmDialog
                title="Delete your account?"
                description={`Type "${user.email}" to confirm deletion.`}
                confirmLabel="Delete account"
                variant="destructive"
                requireTextMatch={user.email}
                onConfirm={deleteAccount}
              >
                <Button variant="destructive" size="sm">Delete account</Button>
              </ConfirmDialog>
            }
          />
        </DangerZone>
      </div>
    </PageShell>
  );
}

function ProfileCard({
  user,
  onSave,
  isSaving,
  error,
}: {
  user: { name: string; email: string; avatarUrl?: string };
  onSave: (data: { name: string; email: string }) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const nameId = useId();
  const emailId = useId();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ name, email });
  }

  const dirty = name !== user.name || email !== user.email;

  return (
    <Card>
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>Your public identity across the platform.</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <Alert.Title>Could not save profile</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        )}
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} alt={user.name} size="lg" />
          <Button variant="secondary" size="sm">Change photo</Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Display name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-body-sm text-muted-foreground">
              Used for notifications and account recovery.
            </p>
          </div>
        </form>
      </Card.Content>
      <Card.Footer className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => { setName(user.name); setEmail(user.email); }}
          disabled={!dirty}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSaving}
          disabled={!dirty}
        >
          Save profile
        </Button>
      </Card.Footer>
    </Card>
  );
}

function NotificationsCard({
  user,
  onUpdate,
}: {
  user: { notifications: { updates: boolean; security: boolean } };
  onUpdate: (key: "updates" | "security", value: boolean) => void;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Notifications</Card.Title>
        <Card.Description>Choose what you want to hear about.</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <ToggleField
          label="Product updates"
          description="New features, improvements, and changelog highlights."
          checked={user.notifications.updates}
          onChange={(v) => onUpdate("updates", v)}
        />
        <ToggleField
          label="Security alerts"
          description="Sign-ins from new devices, password changes."
          checked={user.notifications.security}
          onChange={(v) => onUpdate("security", v)}
        />
      </Card.Content>
    </Card>
  );
}

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

---

## Step 7 — Slop test

| Gate | Result |
|---|---|
| L-01–L-06 | PASS |
| T-01–T-08 | PASS |
| C-01 PageShell | PASS |
| C-02 ConfirmDialog | PASS — delete account wrapped |
| C-03 EmptyState | N/A — page is always populated |
| A-04 Label htmlFor | PASS — both inputs paired, both toggles paired |
| R-01–R-04 | PASS — single column, max-w-3xl |
| V-01 | PASS — no invented metrics |
| V-02 | PASS — buttons are verbs ("Save profile", "Delete account") |
| V-04 | PASS — error message has Title + Description |
| **SF-01** DangerZone last | PASS |
| **SF-02** One concern per Card | PASS — Profile + Notifications + DangerZone |
| **SF-03** Save in Card.Footer | PASS — per-Card save |

**32 / 32 + 3 = 35 / 35 ✓**

---

## Handoff

```
Build complete: src/app/settings/account/page.tsx (138 lines).

Next steps:
- Wire `useAccount()` hook (or add the API methods to your existing store).
- For team settings, replicate this structure at /settings/team with team-specific Cards.
- For billing, see P8 BillingPage archetype.
- The `<DangerZone.Action>` typing requires explicit text match — the requireTextMatch prop on ConfirmDialog enforces it.
```
