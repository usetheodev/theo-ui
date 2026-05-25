# Composition cookbook — 12 page archetypes

Slim index. Pick the archetype code (P1–P12), then read its recipe section below. Don't load this whole file at once on small builds — jump to your pick.

---

## Index

| Code | Archetype | Surface | Anchor composite | When |
|---|---|---|---|---|
| **P1** | ListPage | cloud-dashboard | `<PageShell>` + `<ActionBar>` + `<DataTable>` | The default dashboard list page. |
| **P2** | DetailPage | cloud-dashboard | `<PageShell>` + multi-`<Card>` + `<DropdownMenu>` | Single entity drill-down. |
| **P3** | SettingsPage | settings-form | `<PageShell>` + stacked `<Card>` + `<DangerZone>` | Account / project / team settings. |
| **P4** | ChatSurface | agent-chat | `<ChatThread>` + `<ChatComposer>` + `<AgentTimeline>` | Conversational AI surface. |
| **P5** | AgentEditor | agent-chat | `<AgentEditor>` + `<PreviewPanel>` | Editing an agent's system prompt + behavior. |
| **P6** | DeploymentsList | cloud-dashboard | `<PageShell>` + `<DataTable>` + `<DeploymentRow>` | Specialized list for deployments (Vercel-style). |
| **P7** | EnvironmentDetail | cloud-dashboard | `<PageShell>` + `<Card>` + `<EnvVarEditor>` + `<DomainConfig>` | Environment configuration drill-down. |
| **P8** | BillingPage | settings-form | `<PageShell>` + `<UsageMeter>` grid + pricing-tier `<Card>`s | Billing + plan + usage. |
| **P9** | OnboardingFlow | settings-form | `<Card>` stepped + `<Progress>` | Multi-step setup wizard. |
| **P10** | SignInPage | auth | `<LoginSplit>` or centered `<Card>` + `<SocialAuthRow>` | Sign in / sign up. |
| **P11** | OTPVerifyPage | auth | `<Card>` + `<PinInput>` | OTP verification. |
| **P12** | MarketingLanding | marketing | hero + 3-col features + pricing | Landing / pricing / feature pages. |

---

## Diversification policy

**Consistency over rotation.** Two ListPages in the same app SHOULD look identical in structure — the surface contract demands it. The user's mental model relies on it.

The exception: when the user crosses surface boundaries (a marketing landing → a dashboard list → a chat surface), the visual register naturally shifts. Each surface picks its archetype family from the appropriate cluster.

---

## P1 — ListPage

**Use when:** the page renders a list/table of N entities with filter + search + add-new actions. The most common dashboard archetype.

**Anchor:** `<PageShell>` (header + state machine) + `<ActionBar>` (search/filter/CTA) + `<DataTable>` (rows + sort + pagination + row actions).

**Composition:**

```tsx
<PageShell
  title="Deployments"
  description="Manage your project deployments."
  search={{ placeholder: "Search deployments…", value: q, onChange: setQ }}
  primaryAction={{ label: "New deployment", icon: Plus, onClick: openWizard }}
  loading={isLoading}
  error={error ? { message: error.message, onRetry: refetch } : undefined}
  empty={items.length === 0 && !q ? {
    title: "No deployments yet",
    description: "Connect a Git repo to deploy your first project.",
    action: { label: "Connect repo", onClick: openWizard },
  } : undefined}
>
  <DataTable
    columns={[
      { key: "name", label: "Name", sortable: true },
      { key: "status", label: "Status", render: (d) => <Badge variant={...}>{d.status}</Badge> },
      { key: "createdAt", label: "Created", hideBelow: "md", render: (d) => <Timestamp date={d.createdAt} /> },
    ]}
    data={items}
    rowKey={(d) => d.id}
    rowActions={(d) => (
      <>
        <DropdownMenu.Item onSelect={() => view(d)}>View</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => edit(d)}>Edit</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item className="text-destructive" onSelect={() => del(d)}>Delete</DropdownMenu.Item>
      </>
    )}
    pagination={{ pageSize: 20 }}
  />
</PageShell>
```

**Variants:**
- **Card grid (instead of table)** — for entities with rich tiles (Projects). Use a responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` instead of `<DataTable>`, and `<ProjectCard>` (composite) for each row.
- **Master-detail split** — `<PageShell>` body contains a 2-col grid: 1/3 list + 2/3 detail. Below `md`, list takes full width and detail opens as a drawer.

---

## P2 — DetailPage

**Use when:** the user drilled from a list to a single entity. Shows metadata + sub-resources + actions.

**Anchor:** `<PageShell>` + multiple `<Card>` sections + `<DropdownMenu>` for the entity actions.

**Composition:**

```tsx
<PageShell
  title={item.name}
  description={item.description}
  breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: item.name }]}
  primaryAction={
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="primary">Actions <ChevronDown className="ml-1 h-4 w-4" /></Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onSelect={redeploy}>Redeploy</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={openSettings}>Settings</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <ConfirmDialog title="Delete project?" ...>
          <DropdownMenu.Item className="text-destructive" onSelect={(e) => e.preventDefault()}>
            Delete
          </DropdownMenu.Item>
        </ConfirmDialog>
      </DropdownMenu.Content>
    </DropdownMenu>
  }
>
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <StatTile label="Deployments" value={stats.deployments} />
    <StatTile label="Success rate" value={`${stats.successRate}%`} />
    <StatTile label="Last deploy" value={stats.lastDeploy} valueFormat="relative-time" />
    <StatTile label="Environments" value={stats.environments} />
  </div>
  <Card>
    <Card.Header>
      <Card.Title>Recent deployments</Card.Title>
    </Card.Header>
    <Card.Content>
      <DataTable columns={...} data={recent} />
    </Card.Content>
  </Card>
  <Card className="mt-6">
    <Card.Header>
      <Card.Title>Environments</Card.Title>
    </Card.Header>
    <Card.Content>
      {/* env list */}
    </Card.Content>
  </Card>
</PageShell>
```

**Variants:**
- **Tabbed detail** — wrap the cards in `<Tabs>` (Overview / Deployments / Environments / Settings).
- **Sidebar nav** — left rail with section nav + right content.

---

## P3 — SettingsPage

See [`surfaces/settings-form.md`](surfaces/settings-form.md) for the full recipe. Quick form:

```tsx
<PageShell title="Account settings" description="Manage your profile and preferences.">
  <div className="space-y-6 max-w-3xl">
    <Card>{/* Profile */}</Card>
    <Card>{/* Notifications */}</Card>
    <Card>{/* Security */}</Card>
    <DangerZone>{/* Delete account */}</DangerZone>
  </div>
</PageShell>
```

---

## P4 — ChatSurface

See [`surfaces/agent-chat.md`](surfaces/agent-chat.md) for the full recipe. Quick form:

```tsx
<div className="flex flex-col h-screen">
  <ChatThread className="flex-1">
    {messages.map((m) => <ChatMessage key={m.id} role={m.role} parts={m.parts} />)}
    {isStreaming && <AgentStreaming />}
  </ChatThread>
  <ChatComposer onSend={send} disabled={isStreaming} />
</div>
```

**Variants:**
- **With history sidebar** — left rail with `<CommandPalette>` for recent conversations + new chat button.
- **With preview panel** — right rail with `<PreviewPanel>` showing artifacts generated by the assistant.
- **Full app shell** — sidebar (history) + main chat + preview panel. Below `md`, history collapses to drawer, preview becomes a tab.

---

## P5 — AgentEditor

**Use when:** the user is editing an agent's instructions, capabilities, model selection, tool permissions.

**Anchor:** `<AgentEditor>` (composite that handles the multi-tab editor surface) + `<PreviewPanel>` (live preview of how the agent will behave).

**Composition:**

```tsx
<PageShell
  title="Edit agent"
  description={`Configure ${agent.name}.`}
  breadcrumbs={[{ label: "Agents", href: "/agents" }, { label: agent.name }]}
  primaryAction={{ label: "Save changes", onClick: save, loading: saving }}
>
  <div className="grid lg:grid-cols-[1fr_400px] gap-6">
    <AgentEditor
      agent={agent}
      onChange={setAgent}
      onTest={runTest}
    />
    <PreviewPanel>
      <ChatThread>
        {testMessages.map((m) => <ChatMessage key={m.id} {...m} />)}
      </ChatThread>
    </PreviewPanel>
  </div>
</PageShell>
```

---

## P6 — DeploymentsList

Specialized P1 with the `<DeploymentRow>` composite for each row. Use when the list IS deployments specifically (status + duration + commit + branch + author all rendered in a row with consistent shape).

```tsx
<PageShell title="Deployments" ...>
  <div className="space-y-2">
    {deployments.map((d) => (
      <DeploymentRow
        key={d.id}
        deployment={d}
        onRollback={() => rollback(d.id)}
        onView={() => view(d.id)}
      />
    ))}
  </div>
</PageShell>
```

`<DeploymentRow>` internally uses `<Card>` chrome plus `<StatusDot>`, `<Badge>`, `<Timestamp>`, `<Avatar>`, and a `<DropdownMenu>` for actions. Don't hand-roll this row layout — the composite is the right shape.

---

## P7 — EnvironmentDetail

**Use when:** drilled into a single environment (production / preview / development) to configure env vars + domains + secrets.

**Anchor:** `<PageShell>` + `<Card>` per concern + `<EnvVarEditor>` + `<DomainConfig>`.

```tsx
<PageShell
  title="Production"
  description="Environment configuration for your production deployments."
  breadcrumbs={[{ label: "Project", href: "/p/abc" }, { label: "Environments", href: "/p/abc/envs" }, { label: "Production" }]}
>
  <div className="space-y-6 max-w-4xl">
    <Card>
      <Card.Header>
        <Card.Title>Domains</Card.Title>
        <Card.Description>Custom domains pointing to this environment.</Card.Description>
      </Card.Header>
      <Card.Content>
        <DomainConfig
          domains={env.domains}
          onAdd={addDomain}
          onRemove={removeDomain}
        />
      </Card.Content>
    </Card>

    <Card>
      <Card.Header>
        <Card.Title>Environment variables</Card.Title>
        <Card.Description>Encrypted at rest. Available at build and runtime.</Card.Description>
      </Card.Header>
      <Card.Content>
        <EnvVarEditor
          variables={env.vars}
          onAdd={addVar}
          onUpdate={updateVar}
          onDelete={deleteVar}
        />
      </Card.Content>
    </Card>
  </div>
</PageShell>
```

---

## P8 — BillingPage

**Use when:** billing + plan + usage display. Combines a usage meter grid (current consumption) with pricing tier cards (current plan + upgrade options).

```tsx
<PageShell title="Billing" description="Manage your plan and usage.">
  <div className="space-y-6 max-w-5xl">
    <Card>
      <Card.Header>
        <Card.Title>Current plan</Card.Title>
        <div className="flex items-center gap-2">
          <PlanBadge variant="primary">Pro</PlanBadge>
          <span className="text-body-md text-muted-foreground">Renews on Jan 15, 2026</span>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UsageMeter label="Bandwidth" current={147} max={1000} unit="GB" />
          <UsageMeter label="Build minutes" current={840} max={6000} unit="min" />
          <UsageMeter label="Function invocations" current={2.1} max={10} unit="M" />
        </div>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary">Upgrade plan</Button>
        <Button variant="ghost">View invoices</Button>
      </Card.Footer>
    </Card>

    <Card>
      <Card.Header>
        <Card.Title>Plans</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <Card key={tier.id} className={tier.featured ? "border-primary" : undefined}>
              <Card.Header>
                <Card.Title>{tier.name}</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="text-display-md font-mono">${tier.price}<span className="text-body-md">/mo</span></div>
                <ul className="mt-4 space-y-1 text-body-sm">
                  {tier.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </Card.Content>
              <Card.Footer>
                <Button variant={tier.featured ? "primary" : "secondary"} className="w-full">
                  {tier.cta}
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Card.Content>
    </Card>

    <Card>
      <Card.Header>
        <Card.Title>Payment method</Card.Title>
      </Card.Header>
      <Card.Content>
        {/* card details */}
      </Card.Content>
    </Card>
  </div>
</PageShell>
```

---

## P9 — OnboardingFlow

**Use when:** multi-step wizard for setup (connect git → choose framework → configure env → deploy).

```tsx
<PageShell
  title="Connect your project"
  description={`Step ${step} of ${total}`}
>
  <div className="max-w-2xl mx-auto">
    <Progress value={step / total * 100} className="mb-8" />

    <Card>
      <Card.Header>
        <Card.Title>{stepConfig.title}</Card.Title>
        <Card.Description>{stepConfig.description}</Card.Description>
      </Card.Header>
      <Card.Content>
        {stepConfig.render()}
      </Card.Content>
      <Card.Footer className="flex justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 1}>
          Back
        </Button>
        <Button variant="primary" onClick={next} loading={advancing}>
          {step === total ? "Finish" : "Continue"}
        </Button>
      </Card.Footer>
    </Card>
  </div>
</PageShell>
```

---

## P10 — SignInPage

See [`surfaces/auth.md`](surfaces/auth.md) for the full recipe.

---

## P11 — OTPVerifyPage

See [`surfaces/auth.md`](surfaces/auth.md) > OTP / verification code section.

---

## P12 — MarketingLanding

See [`surfaces/marketing.md`](surfaces/marketing.md) for the full recipe.

---

## Cross-archetype patterns

### Nav bar (app shell)

For all dashboard / settings / chat / auth (post-signin) pages — a top nav bar:

```tsx
<header className="border-b border-border bg-card sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <div className="flex items-center gap-6">
      <Link href="/" className="font-display font-semibold text-title-md">Theo</Link>
      <nav className="hidden md:flex gap-1">
        <Button variant="ghost" size="sm" asChild><Link href="/projects">Projects</Link></Button>
        <Button variant="ghost" size="sm" asChild><Link href="/agents">Agents</Link></Button>
        <Button variant="ghost" size="sm" asChild><Link href="/usage">Usage</Link></Button>
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" aria-label="Open command palette">
        <CommandIcon className="h-4 w-4" />
      </Button>
      <AccountMenu user={user} onSignOut={signOut} />
    </div>
  </div>
</header>
```

Below `md`, the nav links collapse behind a hamburger button.

### Side nav (app shell)

Some apps prefer a left rail nav instead of (or in addition to) a top bar:

```tsx
<div className="flex h-screen">
  <aside className="hidden md:flex md:w-56 flex-col border-r border-border bg-card">
    <div className="p-4">
      <Link href="/" className="font-display font-semibold text-title-md">Theo</Link>
    </div>
    <nav className="flex-1 px-2 space-y-1">
      <NavLink href="/projects" icon={Folder} active>Projects</NavLink>
      <NavLink href="/agents" icon={Bot}>Agents</NavLink>
      <NavLink href="/usage" icon={BarChart}>Usage</NavLink>
      <NavLink href="/settings" icon={Settings}>Settings</NavLink>
    </nav>
    <div className="p-2 border-t border-border">
      <AccountMenu user={user} align="top" />
    </div>
  </aside>
  <main className="flex-1 overflow-y-auto">
    {/* page content */}
  </main>
</div>
```

Below `md`, the side rail becomes a `<Dialog>` drawer triggered by a menu button in the page header.

### Command palette

Most apps benefit from a global `<CommandPalette>` at `Cmd+K` / `Ctrl+K`:

```tsx
<CommandPalette
  open={paletteOpen}
  onOpenChange={setPaletteOpen}
  groups={[
    { heading: "Pages", items: pageItems },
    { heading: "Actions", items: actionItems },
    { heading: "Recent", items: recentItems },
  ]}
/>
```

Triggered by a global keyboard listener (`useEffect` on mount). The shortcut hint `⌘K` appears next to the search icon in the nav bar.

### Empty state

For any empty list / no-data state, use `<EmptyState>`:

```tsx
<EmptyState
  icon={Rocket}
  title="No deployments yet"
  description="Connect a Git repo to deploy your first project."
  action={{ label: "Connect repo", onClick: openWizard }}
/>
```

Single icon + heading + body + optional CTA. Never custom layouts for empty states.

### Loading state (full page)

For full-page loading (data still fetching), use `<PageShell loading>`:

```tsx
<PageShell title="Deployments" loading>
  {/* children ignored while loading=true */}
</PageShell>
```

Renders a centered card with `<Loader2 className="animate-spin" />` + "Loading…" text. Override via `loadingNode` prop for a skeleton matching the page shape.

### Error state

For full-page errors (fetch failed, etc.), use `<PageShell error>`:

```tsx
<PageShell
  title="Deployments"
  error={{
    message: "Could not load deployments. Network failed.",
    onRetry: refetch,
    docsHref: "https://docs.usetheo.dev/troubleshooting",
  }}
/>
```

Renders a card with the error message + retry button + optional docs link.

---

## When to break the archetype

The archetype is a starting point, not a cage. Break it when:

- The brief explicitly asks for a layout not in the catalog (split-screen comparison, kanban board, calendar grid).
- The data shape doesn't fit (e.g., a 50-column matrix that doesn't compress to a `<DataTable>`).
- The user has specific brand requirements that override the surface defaults.

In all these cases, state the break out loud:

> *"This brief doesn't fit any archetype cleanly — building a custom split-screen comparison layout. I'll still use `@usetheo/ui` primitives + tokens, but the page shape is custom."*

Don't break archetypes silently. The accountability is the diff between "following the system" and "drifting back to defaults."
