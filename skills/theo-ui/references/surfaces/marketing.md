# Surface — marketing

Landing pages, pricing pages, feature pages, homepage. The surface vocabulary is **typographic, hierarchy-led, restrained** — the user is unfamiliar with the product and you have ~3 seconds to communicate value.

This is the ONE surface where theo-ui composites take a backseat to typography + custom layout. `@usetheo/ui` is primarily a product UI library, not a marketing site builder. Use primitives + tokens; reach for composites only where they fit (pricing tier Cards, plan badges, usage examples).

---

## When this surface applies

The brief mentions any of:

- landing page / homepage / marketing site
- hero section / above the fold
- pricing / plans / tiers / compare
- features page / capabilities / showcase
- about / changelog / blog / docs root
- public-facing page (not behind auth)

If the brief is *"build a Vercel.com-style landing"* / *"pricing page"* / *"hero for our SaaS"* — this surface.

---

## Anchor composites + primitives

| Component | Use |
|---|---|
| `<Button>` | Primary + secondary CTAs in hero, feature sections, pricing tiers. `size="lg"` for hero. |
| `<Card>` | Pricing tier cards, feature cards, testimonial cards. |
| `<Badge>` | "New", "Beta", "Live" announcement pills. |
| `<PlanBadge>` | Featured pricing tier indicator. |
| `<StatTile>` | Stats grid in social-proof sections. |
| `<Avatar>` | Customer logos, testimonial avatars. |
| `<UsageMeter>` | "Live" usage visualizations on feature pages. |
| `<CostMeter>` | Pricing calculator. |
| `<CodeBlock>` | Code examples in dev-focused marketing. |
| `<DataTable>` | Compare table (plan features) — but consider a Card grid instead. |

---

## Layout

There is no single canonical layout — marketing diversifies on purpose. The skill picks one of three archetypes from the cookbook:

### Archetype P12a · Stacked editorial

```tsx
<main>
  <NavBar />
  <HeroBand
    eyebrow="Introducing"
    headline="Build with confidence."
    description="The cloud platform for AI-first applications."
    primaryAction={{ label: "Start free", href: "/signup" }}
    secondaryAction={{ label: "View pricing", href: "/pricing" }}
  />
  <FeatureBand columns={3} />
  <PricingBand tiers={tiers} />
  <FooterBand />
</main>
```

Use when: SaaS marketing, dev tool, infrastructure platform.

### Archetype P12b · Bento grid

```tsx
<main>
  <NavBar />
  <HeroBand />
  <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto px-4 py-16">
    <Card className="md:col-span-2 row-span-2">  {/* big tile */}
      <Card.Content className="aspect-video">
        {/* product preview */}
      </Card.Content>
      <Card.Header>
        <Card.Title>Deploy in seconds</Card.Title>
        <Card.Description>Push to main. We do the rest.</Card.Description>
      </Card.Header>
    </Card>
    <Card>{/* feature 2 */}</Card>
    <Card>{/* feature 3 */}</Card>
    <Card className="md:col-span-2">{/* feature 4 */}</Card>
    <Card>{/* feature 5 */}</Card>
  </section>
  <FooterBand />
</main>
```

Use when: feature-rich product, multiple equally important capabilities.

### Archetype P12c · Long document

```tsx
<main className="max-w-3xl mx-auto px-4 py-24">
  <NavBar />
  <article className="prose prose-neutral dark:prose-invert">
    {/* hero headline */}
    <h1 className="text-display-xl">A new way to deploy.</h1>
    <p className="text-body-lg text-muted-foreground">
      We rebuilt the deployment pipeline from scratch...
    </p>
    {/* sections as headings + body */}
    <h2 className="text-headline">The problem</h2>
    <p>...</p>
    <h2 className="text-headline">Our approach</h2>
    <p>...</p>
    {/* CTA */}
    <Button size="lg" variant="primary">Get started</Button>
  </article>
  <FooterBand />
</main>
```

Use when: manifesto, changelog, blog post, story-driven landing.

---

## Typography on marketing surfaces

This is the ONE surface where the display tier earns its keep:

- **Hero headline** → `text-display-2xl` (64 px) at desktop, `text-display-xl` (48 px) on tablet, `text-display-lg` (40 px) on mobile. Use responsive utility: `text-display-lg md:text-display-xl xl:text-display-2xl`.
- **Hero description** → `text-body-lg` (18 px) `text-muted-foreground`. Max ~70 chars width for readability.
- **Eyebrow** above hero → `text-label-caps` `text-muted-foreground`.
- **Section headline** → `text-display-lg` (40 px) or `text-display-md` (32 px) depending on hierarchy.
- **Feature card title** → `text-title-lg` (24 px) via `<Card.Title>`.
- **Pricing tier name** → `text-title-lg` (24 px).
- **Pricing price** → `text-display-xl` (48 px) `font-mono` for the digits.

### Sentence-case + period termination

Headlines like *"Build with confidence."* end with a period. That punctuation is part of the Vercel-inspired voice. Don't end with `!`. Don't ALL-CAPS.

---

## Hero band

The hero is the page's first impression. theo-ui doesn't ship a `<HeroBand>` composite — you compose primitives:

```tsx
<section className="py-16 md:py-24 px-4">
  <div className="max-w-5xl mx-auto text-center">
    <Badge variant="secondary" className="mb-6">
      <Sparkles className="h-3 w-3 mr-1" />
      New: AI assistant
    </Badge>

    <h1 className="text-display-lg md:text-display-xl xl:text-display-2xl text-foreground mb-6">
      Build with confidence.
    </h1>

    <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10">
      The cloud platform for AI-first applications. Deploy in seconds, scale automatically,
      pay only for what you use.
    </p>

    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button variant="primary" size="lg" asChild>
        <a href="/signup">Start free</a>
      </Button>
      <Button variant="secondary" size="lg" asChild>
        <a href="/pricing">View pricing</a>
      </Button>
    </div>
  </div>
</section>
```

### Hero layout variants

- **Center-aligned** (above) — default. Works for most SaaS / dev-tool marketing.
- **Left-aligned with media on the right** — pair hero copy with a product screenshot. Use a 2-column grid: `md:grid-cols-2`.
- **Vertical with gradient backdrop** — only when the genre is "atmospheric" (e.g., AI / creative tool).

### Avoid

- Hero with stock photo background and centered text overlay.
- Hero with "+47% productivity boost" (invented metric — gate V-01).
- Hero with marketing fluff: *"Unlock your full potential!"*.

---

## Pricing band

```tsx
<section className="py-24 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-display-md text-foreground mb-3">Pricing</h2>
      <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">
        Start free. Upgrade when you're ready.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {tiers.map((tier) => (
        <Card key={tier.id} className={tier.featured ? "border-primary" : undefined}>
          {tier.featured && (
            <div className="px-6 pt-6">
              <PlanBadge variant="primary">Most popular</PlanBadge>
            </div>
          )}
          <Card.Header>
            <Card.Title>{tier.name}</Card.Title>
            <Card.Description>{tier.tagline}</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="mb-6">
              <span className="text-display-xl text-foreground font-mono">${tier.price}</span>
              <span className="text-body-md text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-body-md">
                  <Check className="h-4 w-4 mt-0.5 text-success shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card.Content>
          <Card.Footer>
            <Button
              variant={tier.featured ? "primary" : "secondary"}
              size="lg"
              className="w-full"
              asChild
            >
              <a href={tier.cta}>{tier.ctaLabel}</a>
            </Button>
          </Card.Footer>
        </Card>
      ))}
    </div>
  </div>
</section>
```

### Pricing rules

- **3 tiers max** on the hero pricing band. More tiers = compare table on a separate page.
- **Featured tier outlined**, not background-colored. `<Card className="border-primary">` not `<Card className="bg-primary text-primary-foreground">` (that's the legacy Vercel "polarity flip" — visually loud).
- **Price in `text-display-xl` `font-mono`** — the digits should align across tiers.
- **CTA matches tier weight** — featured tier gets `variant="primary"`, others get `variant="secondary"`.

---

## Feature band

Three patterns:

### 3-column grid

```tsx
<section className="py-24 px-4">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-display-md text-foreground text-center mb-16">
      Everything you need to ship.
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f) => (
        <div key={f.id}>
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
            <f.icon className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="text-title-md text-foreground mb-2">{f.title}</h3>
          <p className="text-body-md text-muted-foreground">{f.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### Alternating row pairs

```tsx
{features.map((f, i) => (
  <section key={f.id} className="py-16 px-4">
    <div className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center ${i % 2 ? "md:grid-flow-col-dense" : ""}`}>
      <div className={i % 2 ? "md:col-start-2" : ""}>
        <Badge variant="secondary" className="mb-4">{f.eyebrow}</Badge>
        <h2 className="text-display-md text-foreground mb-4">{f.title}</h2>
        <p className="text-body-lg text-muted-foreground mb-6">{f.description}</p>
        <Button variant="link" asChild>
          <a href={f.href}>Learn more →</a>
        </Button>
      </div>
      <div className={i % 2 ? "md:col-start-1 md:row-start-1" : ""}>
        {/* media or code example */}
      </div>
    </div>
  </section>
))}
```

### Stat-led

```tsx
<section className="py-24 px-4">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-display-md text-foreground text-center mb-12">
      Trusted by teams shipping production.
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatTile label="Active deployments" value="1.2M" valueFormat="abbreviated" />
      <StatTile label="Build success rate" value="99.94%" />
      <StatTile label="Avg deploy time" value="42s" />
      <StatTile label="Customers" value="5,200+" />
    </div>
  </div>
</section>
```

**Critical** — only emit `<StatTile>` with REAL numbers. If you don't have the data, drop the band or use placeholders. Invented metrics fail slop-test gate **V-01**.

---

## Imagery strategy

Marketing surfaces frequently need imagery. Order of preference:

1. **Real product screenshots** — wrapped in a `<Card>` with `<BrowserControls>` for the chrome (a primitive that draws real browser controls, not faked).
2. **Real customer logos** — monochrome SVGs at consistent height.
3. **Hand-built CSS art** — geometric patterns, gradient meshes, abstract decoration.
4. **Lucide icons** — for feature tiles.
5. **No imagery** — typography-only. This is often the strongest choice.

### Avoid

- **Fake browser chrome** — never hand-build a URL bar with traffic-light dots. Use `<BrowserControls>` or omit the chrome.
- **Invented stock photos** — never tell the user "I added a placeholder hero image" by emitting a `<div>` with a gradient and pretending it's a screenshot.
- **Logo placeholders for customers you don't have** — never `<div>BigCo</div>` x 6 to imply customers.

---

## Nav + footer

### Marketing nav

Theo-ui doesn't ship a marketing nav composite. Compose:

```tsx
<nav className="border-b border-border bg-card sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <div className="flex items-center gap-8">
      <Link href="/" className="font-display font-semibold text-title-md">Theo</Link>
      <div className="hidden md:flex gap-1">
        <Button variant="ghost" size="sm" asChild><Link href="/features">Features</Link></Button>
        <Button variant="ghost" size="sm" asChild><Link href="/pricing">Pricing</Link></Button>
        <Button variant="ghost" size="sm" asChild><Link href="/docs">Docs</Link></Button>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild><Link href="/signin">Sign in</Link></Button>
      <Button variant="primary" size="sm" asChild><Link href="/signup">Get started</Link></Button>
    </div>
  </div>
</nav>
```

Below `md`, the link cluster collapses behind a hamburger button that opens a `<Dialog>` full-screen menu.

### Marketing footer

```tsx
<footer className="border-t border-border bg-card mt-24">
  <div className="max-w-7xl mx-auto px-4 py-12">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
      <div>
        <h4 className="text-label-caps text-muted-foreground mb-3">Product</h4>
        <ul className="space-y-2 text-body-sm">
          <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
          {/* ... */}
        </ul>
      </div>
      {/* 3 more columns */}
    </div>
    <div className="flex items-center justify-between pt-8 border-t border-border">
      <span className="text-body-sm text-muted-foreground">© 2026 Theo</span>
      <div className="flex gap-3">
        {/* social icons */}
      </div>
    </div>
  </div>
</footer>
```

---

## Anti-patterns specific to marketing

- **Reaching for dashboard composites on marketing surfaces** — `<PageShell>` belongs in the app, not the homepage.
- **Centering everything** — alternating layouts (center / left / 2-col / 3-col) is what diversifies marketing.
- **Invented social proof** — no fake logos, fake testimonials, fake metric counts.
- **Marketing fluff copy** — *"Unlock your full potential"* / *"Take your X to the next level"* / *"Future-proof your stack"* — banned. Verb + concrete value or nothing.
- **Hero with 3+ CTAs** — one primary, optional one secondary, never more.
- **Pricing tier styled as `bg-primary text-primary-foreground`** — that's a sales-y signal. Use `border-primary` + `<PlanBadge>` instead.
- **Footer with social-row mega-grid** — 4 columns max. Cut links rather than expand the grid.
