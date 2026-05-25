# Baseline: Density Audit (2026-05-22)

Snapshot **pré-tightening** das dimensões atuais do `@usetheo/ui@0.2.0-next.0` vs sites FAANG-tier de referência (Linear / Vercel / Stripe / shadcn / Mantine).

## Form controls

| Component | Theo (atual) | shadcn | Mantine `md` | Linear (medido) | Vercel (medido) | Target (este plano) |
|---|---|---|---|---|---|---|
| Button `md` | **40px** (`h-10`) | 36px (`h-9`) | 36px | ~36px | ~36px | **36px** |
| Input `md` | **40px** (`h-10`) | 36px (`h-9`) | 36px | ~36px | ~36px | **36px** |
| Select.Trigger `md` | **40px** (`h-10`) | 36px (`h-9`) | 36px | ~36px | ~36px | **36px** |
| Textarea `md` | min-h **96px** (`min-h-[6rem]`) | min-h ~80px | ~80px | — | — | min-h **96px** (no change — multiline tem racional próprio) |

Theo está **+11%** acima do padrão FAANG-modern.

## Surfaces

| Surface | Theo (atual) | Target |
|---|---|---|
| Card padding `md` | **24px** (`p-6`) | **20px** (`p-5`) |
| Body text (`body-md`) | **15px** lh 1.5 | **14px** lh 1.43 |

## Já alinhado (não muda)

| Component | Theo | Pattern industry | Status |
|---|---|---|---|
| Checkbox `md` | 16px (`size-4`) | shadcn 16, Material 18-20 | ✅ aligned |
| Switch track `md` | 20×36 (`h-5 w-9`) | shadcn 24×44, Material 32×52 | ✅ already tighter than industry — keep |
| Avatar `md` | 36px (`size-9`) | shadcn 32-40 | ✅ aligned |
| Badge `md` | px-2.5 py-0.5 text-label | text-xs equivalents | ✅ aligned |
| Toast padding `md` | p-4 (16px) | shadcn 16-20 | ✅ aligned |

## WCAG policy comparison

| Standard | Min target | Theo `comfortable` (36px) | Theo `compact` (32px) | Theo `spacious` (44px) |
|---|---|---|---|---|
| 2.5.8 AA  | 24×24 effective | ✅ pass (with focus ring) | ✅ pass | ✅ pass |
| 2.5.5 AAA | 44×44           | ❌ fail                 | ❌ fail | ✅ pass |

Theo targets **AA** (acceptable trade-off documented in T5.1 Density policy).

## Composites usando Button/Input/Select hardcoded

Grep returnou 11 composites com `h-10`/`text-body-md` hardcoded fora dos primitives. Esses **não fazem parte deste plano** (são instances que recebem o ajuste automaticamente via primitive). Listed for awareness only:

- folder-selector
- agent-profile
- permission-matrix
- intent-selector
- quick-action-chips
- skeleton
- social-auth-row
- model-selector
- hook-config
- skills-list (composite)
- env-var-editor (composite)

Visual smoke em T1.3 confirma que nenhum desses regrediu.

## Body-md hardcoded usage (14 components)

Listados em grep — todos absorvem o ajuste 15→14px automaticamente via tailwind-preset.ts:

agent-event, token-usage-chart, build-log-stream, cost-meter, audit-log-entry, chat-message, chat-thread, agent-streaming, tool-result, tool-call, permission-matrix, diff-viewer, lane-board, terminal-panel.

T2.2 cobre visual smoke nos 4 mais críticos.

## Bundle baseline (current — 2026-05-22, before this plan)

```
dist/index.js          335167 bytes
dist/index.d.ts        132205 bytes
dist/styles.css          2243 bytes
dist/tokens.css          8212 bytes
dist/slide/index.js     23825 bytes
dist/slide-deck/index.js 58413 bytes
```

Expected delta after plan: `dist/index.js` ~+500 bytes (density CSS vars + var() class strings), `dist/index.d.ts` ~+500 bytes (Density type union).
