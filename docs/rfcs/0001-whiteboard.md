# RFC 0001 — Whiteboard primitive

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-18 |
| Status | **Implemented** (2026-05-18) |
| Subpath | `@theokit/ui/whiteboard` |
| Plan | `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/whiteboard-view-primitive-edge-cases-2026-05-18.md` |
| Consumer documented | Confirmed verbally by repo owner (paulohenriquevn) on 2026-05-18 during plan kickoff. Concrete consumer reference (specific TheoCode Desktop screen, TheoKit app, or Theo cloud dashboard panel) to be linked here in the follow-up PR that wires Whiteboard into the consumer surface. |

## 1. Summary

`Whiteboard` é um primitive **view-only** que renderiza um JSON declarativo em SVG com a estética hand-drawn do Excalidraw. Foco: consumir output de LLMs (tool calls como `{"type":"whiteboard","data":{...}}`) e mostrar imediatamente. Sem editor, sem toolbar, sem hit-testing — apenas render + pan/zoom para navegação.

Vive em subpath isolado `@theokit/ui/whiteboard` com peer-deps opcionais (`roughjs`, `perfect-freehand`). Não inflando o barrel principal (`@theokit/ui`).

## 2. Motivation

A categoria "diagrama hand-drawn renderizado a partir de JSON estruturado" não existe no ecossistema TheoUI. Análogos como `Diagram` (Mermaid-like) cobrem fluxogramas com layout automático, mas faltam superfícies onde a LLM escolhe explicitamente o posicionamento dos elementos (arquiteturas, sketches de UI, anotações sobre imagens, brainstorms).

**Consumer documentado:** TODO (placeholder). Sem isso, o RFC não muda de Proposed → Implemented.

**Sem alternativa fora-da-prateleira viável:**
- Excalidraw upstream é uma aplicação de ~13k LOC só no `App.tsx`. Não é primitive.
- `react-rough-fiber` é só wrapper de rough.js, sem schema/viewport/freedraw integrados.
- Mermaid não tem estética sketchy.

Construímos `Whiteboard` como **shell fina** sobre `roughjs` + `perfect-freehand` (consagrados upstream do próprio Excalidraw e tldraw, respectivamente).

## 3. Decision

Nove ADRs governam o design. A lista completa com rationale/consequences vive no plano (`.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md > ADRs`). Sumário aqui:

| ID | Decisão | Por quê em uma linha |
|---|---|---|
| D1 | Renderer = SVG (não Canvas) | A11y nativa + hit-testing futuro grátis + export trivial |
| D2 | `roughjs` + `perfect-freehand` como peer-deps opcionais | Consumer do barrel não paga; quem importa subpath instala explicitamente |
| D3 | Subpath isolado com bundle próprio `dist/whiteboard/index.js` | Não inflando `quality:bundle` baseline do barrel |
| D4 | JSON v1 enxuto, validado com Zod | LLM-friendly; ~5 campos por elemento vs 68 do `.excalidraw` |
| D5 | Pan/zoom via SVG `viewBox` | Sem libs externas; world coordinates limpas; export sai com viewBox correto |
| D6 | Lazy import de `roughjs`/`perfect-freehand` | TTI menor (revisitar após Phase 2 se Suspense overhead > ganho) |
| D7 | Sem hit-testing/selection no MVP | View-only; opt-in via prop futura se consumer pedir |
| D8 | Fora do barrel `src/index.ts` E fora do census | Engines não inflam o catálogo |
| D9 | Seed determinístico via FNV-1a | Snapshots estáveis + SSR-safe + sem jitter |

## 4. JSON v1 schema

Discriminated union por `type`. Sete tipos no MVP: `rect`, `ellipse`, `diamond`, `line`, `arrow`, `text`, `freedraw`.

```jsonc
{
  "version": 1,
  "width": 800,
  "height": 600,
  "background": "#fff",
  "elements": [
    { "type": "rect", "x": 100, "y": 80, "w": 200, "h": 100, "label": "User", "stroke": "#000", "fill": "#fef3c7" },
    { "type": "ellipse", "x": 400, "y": 80, "w": 160, "h": 100, "label": "DB" },
    { "type": "arrow", "x": 300, "y": 130, "to": [400, 130], "label": "query" },
    { "type": "text", "x": 100, "y": 260, "text": "Fluxo de autenticação", "fontSize": 18, "align": "left" },
    { "type": "diamond", "x": 200, "y": 400, "w": 140, "h": 80, "label": "Decision?" },
    { "type": "line", "x": 0, "y": 500, "to": [800, 500] },
    { "type": "freedraw", "x": 0, "y": 0, "points": [[10,10],[50,40],[100,30]] }
  ]
}
```

**Limites de sanidade** (via Zod, ver EC-3/EC-4):
- `width`/`height` da scene: `1..20000`
- `strokeWidth`: `0..50`
- `fontSize`: `0..500`
- `label` / `text`: até 500 / 5000 chars
- `points` de freedraw: 2..5000
- `elements`: até 5000
- Todos `.finite()` — sem NaN/Infinity

Schema completo em `src/components/primitives/whiteboard/schema.ts`.

## 5. Public API

```tsx
import { Whiteboard, type WhiteboardData } from "@theokit/ui/whiteboard";

const scene: WhiteboardData = { version: 1, width: 800, height: 600, elements: [...] };

<Whiteboard
  data={scene}
  className="..."
  initialZoom={1}
  initialCenter={[400, 300]}
  fitOnLoad
  onValidationError={(errors) => console.log(errors)}
  aria-label="Architecture diagram"
/>
```

Peer-deps requeridos pelo consumer:
```bash
pnpm add @theokit/ui roughjs perfect-freehand
```

## 6. Phases

Fases de execução completas em `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md`. Sumário:

| Phase | Entregável |
|---|---|
| 0 | Scaffold + tooling (subpath, sync-exports, tsup, peer-deps, RFC, CHANGELOG) |
| 1 | Schema + validator (Zod + EC-3/EC-4) |
| 2 | SVG renderer (rough.js + perfect-freehand + seed FNV) |
| 3 | Viewport (pan + zoom via viewBox; EC-2 wheel listener manual) |
| 4 | Composição final (`<Whiteboard>` + a11y + stories) |
| 5 | Quality gates + docs alignment + EC-1 bundle isolation gate |
| 6 | Dogfood QA com LLM-gerado JSON |

## 7. Quality gates impactados

- `validateExportsMap` aceita `./whiteboard` como ISOLATED_SUBPATHS.
- `validateComponentStructure` exige `whiteboard.tsx` + `index.ts` (já scaffold).
- `validateBundleSize` ganha verificação EC-1: `dist/index.js` não pode conter strings `roughjs` ou `perfect-freehand`.
- `quality:bundle` baseline do barrel principal **inalterado** (~320KB).
- `validateAxeCoverage` não muda (Whiteboard não é interactive primitive listada).
- `validateReadmeDrift`, `validateCountConsistency`, `validateArchitectureCensus` — Whiteboard não está no barrel, fica fora desses gates por design.

## 8. Riscos + mitigações

### Riscos do RFC

#### EC-17 — Hash collision do FNV-1a
- **Risco:** Dois elementos com mesma (type, x, y, w, h, label) produzem mesmo seed.
- **Mitigação:** Probabilidade ~1 em 4 bilhões para input distinto. Para scenes de 5-50 elementos, irrelevante. Quem precisar pode setar `seed` explícito.

#### EC-18 — RTL/emoji em texto
- **Risco:** Fontes hand-drawn (Virgil/Caveat) têm suporte limitado a árabe/hebraico/japonês.
- **Mitigação:** Fallback automático para fonte do sistema. Quem precisar de fidelidade total usa `fontFamily: "sans"`.

#### EC-19 — Scenes >5k elementos
- **Risco:** SVG degrada performance.
- **Mitigação:** Schema clamp em 5000 elementos. Virtualização entra como RFC futuro se consumer pedir.

#### EC-20 — `pointer-events: none` impede copy-text
- **Risco:** Usuário não consegue selecionar texto dentro do whiteboard.
- **Mitigação:** Trade-off consciente (ADR D7). Prop `interactive` futura habilita.

#### EC-21 — Versão incompatível de peer-dep
- **Risco:** Consumer instala `roughjs@5.x` quando declaramos `^4.6.0`.
- **Mitigação:** pnpm/npm emitem warning. README do subpath documenta versão exata. APIs de rough.js historicamente estáveis.

#### EC-22 — Coordenadas fora do `width x height`
- **Risco:** LLM "desenha fora da página".
- **Mitigação:** Pan/zoom permite navegar. `fitOnLoad` recentra automaticamente.

### Riscos do plano (foram MUST FIX e estão no plano)

- EC-1: bundle isolation regression — agora gate automatizado em `validate-bundle-size.ts`.
- EC-2: `onWheel` passive listener — `addEventListener` manual com `{passive: false}`.
- EC-3: NaN/Infinity em coords — schema `.finite()`.
- EC-4: dimensões absurdas — schema `.max(20000)`.
- EC-5: Zod em runtime — `dependencies` reais, não peer-dep opcional.
- EC-6: callback durante render — sempre em `useEffect`.

## 9. Alternatives considered

### A. Canvas em vez de SVG
Excalidraw upstream usa Canvas. Performance superior para >5k elementos. **Rejeitado** porque: (a) a11y exige trabalho extra (toda interação via matrix); (b) export PNG/SVG requer canvas roundtrip; (c) integração com tema CSS perde nativa. Para 5-50 elementos do uso real (LLM-gerado), SVG basta.

### B. Compatibilidade com formato `.excalidraw`
Aceitar JSON exportado de Excalidraw. **Rejeitado** porque: 68 campos por elemento (`seed`, `version`, `versionNonce`, `index`, `boundElements`, `frameId`, etc.) que LLM não emite naturalmente. Schema próprio enxuto é 10x mais simples para prompt e validação.

### C. Embeber tldraw inteiro
~MB de JS, state management próprio (Zustand), múltiplas peer-deps próprias. Conflito direto com bundle isolation e regra "TheoUI ships React shell, não algoritmo".

### D. Aceitar `.svg` direto sem schema
LLMs podem emitir SVG raw via tool call. **Rejeitado** porque: (a) sem look hand-drawn (precisaria pós-processar); (b) sem validação estrutural; (c) XSS surface enorme (SVG embeb `<script>`).

### E. JSON v1 com schema versionado
Versionamento via campo `version: 1` literal já no Zod. Mudanças breaking forçam major bump do schema e do pacote. Adapter `v1 → v2` entra como follow-up se necessário.

## 10. Open questions

- **Q1:** O lazy import (D6) realmente compensa? Decisão revisável após Phase 2 — se overhead de Suspense > ganho do code-split, volta a ser import síncrono.
- **Q2:** Stories Ladle de `Whiteboard` devem aparecer em registry pública? Posição atual: **não no MVP**. Engines não entram no registry shadcn-compatible até consumer pedir `npx shadcn add whiteboard`.
- **Q3:** Whitelist do `validateReadmeDrift` precisa de `Whiteboard`? Decisão na T5.1 — depende se o README mencionar com backticks ou em prosa.

## 11. Decision log

| Data | Mudança |
|---|---|
| 2026-05-18 | Criado em Proposed status. Phase 0 implementada (subpath + scaffold + RFC + CHANGELOG). |
| 2026-05-18 | Phases 1–5 implementadas. Schema Zod, renderer SVG completo (rect/ellipse/diamond/line/arrow/text/freedraw), pan+zoom, fitOnLoad, fallback de validação. 86 testes específicos + 776 testes totais verdes. 10/10 quality gates verdes. EC-1 bundle-isolation gate ativo em `validate-bundle-size.ts`. Status → **Implemented**. |
