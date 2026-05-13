# @usetheo/ui

> Framework-agnostic React component library. Editorial typography, dark-first violet palette, burnt-sienna accents.
> Built to be consumed by [`theo-code`](../theo-code) and [`theo-agents`](../theo-agents).

## Status

**Pre-alpha.** Bootstrap em andamento (Fase 4/9 do roadmap). Primeiros componentes (Button, Card, Input, ...) chegam na Fase 6.

## Quickstart (uma vez publicado)

```bash
pnpm add @usetheo/ui
```

```css
/* app entrypoint */
@import "@usetheo/ui/tokens.css";
@import "@usetheo/ui/styles.css";
```

```tsx
import { Button } from "@usetheo/ui";

<Button>Deploy</Button>;
```

## Design system: Violet Forge

| Token | Light | Dark |
|---|---|---|
| Primary (Theo violet) | `#7C3AED` | `#7C3AED` |
| Accent (burnt sienna) | `#C96442` | `#C96442` |
| Background | `#FAF9F7` (warm off-white) | `#0E0B14` (charcoal violet-tinted) |
| Display font | Boska (Indian Type Foundry) | Boska |
| Body font | Switzer | Switzer |
| Mono | JetBrains Mono | JetBrains Mono |

Especificação completa: [`docs/design-system.md`](./docs/design-system.md).
Auditoria visual dos concorrentes (Vercel, Railway, Render, Fly.io, Netlify, Coolify): [`docs/design-audit.md`](./docs/design-audit.md).
Material histórico (Theo Brutalist Light antigo, wiremocks Claude): [`referencia/`](./referencia).

## Desenvolvimento

```bash
pnpm install
pnpm dev          # Ladle (preview de componentes em http://localhost:61000)
pnpm test         # Vitest
pnpm typecheck    # tsc --noEmit
pnpm lint         # Biome check
pnpm build        # tsup → dist/
```

## Arquitetura

```
src/
  components/    componentes React (Fase 6+)
  lib/           utilities (cn, etc.)
  styles/        tokens.css, fonts.css, global.css
  test/          vitest setup
.ladle/          preview config
referencia/      material histórico (não editar)
docs/            design-system.md, design-audit.md
registry/        registry shadcn-compatible (Fase 5)
```

## Roadmap

1. ✅ Reorganização (`referencia/`)
2. ✅ Auditoria visual dos 6 concorrentes PaaS
3. ✅ Síntese do DS Violet Forge
4. 🔄 Bootstrap da biblioteca (atual)
5. ⏳ Registry shadcn-compatible
6. ⏳ Componentes primitivos (Button, Card, Input, Badge, Dialog, Tabs, Sidebar, TopNav, CommandPalette, Toast)
7. ⏳ Componentes compostos PaaS (ProjectCard, DeploymentRow, BuildLogStream, PreviewEnvCard, MetricsPanel, EnvVarEditor, DomainConfig, RollbackUI)
8. ⏳ Preview em `theo-agents`
9. ⏳ Docs e governança

## License

Apache-2.0
