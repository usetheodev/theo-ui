# Edge Case Review — whiteboard-view-primitive

**Data:** 2026-05-18
**Plano:** `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md`
**Tasks analisadas:** 18 tasks distribuídas em 6 phases (incluindo Dogfood)
**Edge cases encontrados:** 22 (MUST FIX: 6, SHOULD TEST: 10, DOCUMENT: 6)

**Veredicto: PLANO PRECISA DE AJUSTE** — 6 MUST FIX (a maioria pequenos, 3-5 linhas cada) precisam virar sub-tasks ou ajustes no plano antes da execução. O resto é incorporável como testes adicionais aos TDD cycles já existentes ou notas no RFC.

---

## MUST FIX

### EC-1: Sem gate automatizado garantindo que o barrel `dist/index.js` não contém roughjs / perfect-freehand

- **Task afetada:** T0.2 (e gate global)
- **Família:** Boundary / Build artifact
- **Cenário:** Dev futuro adiciona `export { Whiteboard } from "./components/primitives/whiteboard/index.js"` ao `src/index.ts` por engano (ou para "facilitar imports"), ou alguma transitive import vaza rough.js para o barrel principal. `pnpm build` continua passando, `quality:bundle` baseline pode se atualizar silenciosamente em `--update`.
- **Impacto:** O contrato central do plano (D3: bundle do barrel **inalterado**) viola. Consumer do barrel paga ~37KB extras sem saber. Regressão silenciosa.
- **Fix sugerido:** Adicionar uma sub-task `T5.4.x` (ou inline em `validate-bundle-size.ts`) com 5 linhas:
  ```ts
  // scripts/validate-bundle-size.ts ou novo gate
  const barrel = readFileSync("dist/index.js", "utf-8");
  for (const forbidden of ["roughjs", "perfect-freehand"]) {
    if (barrel.includes(forbidden)) fail("dist/index.js", `barrel contains ${forbidden}; engine leaked into main bundle`);
  }
  ```

### EC-2: `onWheel` com `event.preventDefault()` em React não funciona (listener passivo por padrão)

- **Task afetada:** T3.2
- **Família:** Format / Browser API
- **Cenário:** React 18+ usa `addEventListener` passivo para `wheel` por padrão. Chamar `event.preventDefault()` num handler JSX `onWheel` emite warning no Chrome ("Unable to preventDefault inside passive event listener") e a página continua scrollando enquanto o zoom acontece — UX quebrada.
- **Impacto:** Zoom dispara scroll da página simultaneamente. Em containers `overflow: auto`, fica caos. Reportado como bug, não é óbvio para quem nunca caiu nessa.
- **Fix sugerido:** No plano da T3.2, trocar "onWheel: event.preventDefault()" por addEventListener manual:
  ```tsx
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, -e.deltaY * 0.01); };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomAt]);
  ```

### EC-3: Schema Zod aceita `NaN` e `Infinity` em coordenadas/dimensões

- **Task afetada:** T1.1
- **Família:** Input
- **Cenário:** `z.number()` aceita `NaN` e `Infinity` por padrão. Se a LLM emitir `{"x": NaN}` (acontece quando ela faz cálculos no JSON output: `x: 100 - 100`), o `viewBox` resultante vira `"NaN NaN NaN NaN"` e o SVG não renderiza nada. Ainda pior: `Math.atan2(Infinity, Infinity)` é `NaN` → arrow heads degenerados.
- **Impacto:** Scene silenciosamente quebra. Erro do Zod não dispara porque o schema aceita. Debug é sofrido (devtools mostra atributos inválidos sem explicação).
- **Fix sugerido:** No schema da T1.1, trocar todas as ocorrências de `z.number()` por `z.number().finite()` em coords, dims, `roughness`, `opacity`, `strokeWidth`, `seed`. Uma linha por campo.

### EC-4: Dimensões da scene sem limite superior — DoS visual via LLM

- **Task afetada:** T1.1
- **Família:** Input / Resource
- **Cenário:** LLM emite `{"version":1,"width":1e9,"height":1e9,...}`. Schema aceita (`.positive()` não tem máximo). O `<svg viewBox="0 0 1e9 1e9">` é tecnicamente válido mas o browser tenta alocar buffer enorme; depende do browser ou trava ou simplesmente não renderiza nada.
- **Impacto:** Crash da página em alguns browsers, freeze em outros. Caso de uso real: agente faz cálculo errado de "fit content" e gera dimensões absurdas.
- **Fix sugerido:** T1.1 — clamp explícito: `width: z.number().finite().positive().max(20000)` e mesma coisa para `height`. 20k é largo o bastante para diagramas reais, pequeno o bastante para não estourar buffer.

### EC-5: Zod declarado como peer-dep **opcional** mas usado em `<Whiteboard>` para validação default

- **Task afetada:** T1.1 + T4.1 (conflito entre os dois)
- **Família:** Integration / Resource
- **Cenário:** T1.1 instrui adicionar Zod como peer-dep `optional: true`. T4.1 sugere `validateScene(data)` rodar em `useMemo` por padrão. Consumer que importa `@usetheo/ui/whiteboard` sem instalar Zod recebe `Cannot find module 'zod'` em runtime no primeiro render.
- **Impacto:** Subpath quebra para qualquer consumer que não souber instalar Zod. Mensagem de erro do bundler é confusa (parece bug da lib, não falta de peer).
- **Fix sugerido:** Decidir uma das três (recomendo opção A):
  - **A.** Zod sai dos peers opcionais e entra em **dependencies** normais do subpath. ~12KB gz cabe em "engine bundle". Documentar no RFC.
  - **B.** `<Whiteboard>` recebe `validate?: boolean` (default `false`); só importa Zod via dynamic import se `validate=true`. Validação vira opt-in. Coerente com "view confia no input" mas LLM emite lixo com frequência.
  - **C.** Implementar validação manual (sem Zod) — ~80 linhas de if/else. KISS extremo. Perde mensagens de erro polidas.

### EC-6: `onValidationError` callback chamado durante render é anti-pattern React (state update during render)

- **Task afetada:** T4.1
- **Família:** State / React
- **Cenário:** O plano sugere `validateScene(data)` no `useMemo`. Se a validação falha, o callback `onValidationError(errors)` provavelmente vira `props.onValidationError(errors)` — se chamado direto no body do componente ou no useMemo, e se o callback do consumer chamar `setState`, React lança "Cannot update a component while rendering a different component" em strict mode.
- **Impacto:** Erro em dev mode (StrictMode). Funciona em prod mas é sinal de bug latente.
- **Fix sugerido:** T4.1 — mover invocação do callback para useEffect:
  ```tsx
  const validation = useMemo(() => validateScene(data), [data]);
  useEffect(() => { if (!validation.ok && onValidationError) onValidationError(validation.errors); }, [validation, onValidationError]);
  ```

---

## SHOULD TEST

### EC-7: Arrow com `from === to` ou distância < `headLen`

- **Task afetada:** T2.3
- **Teste sugerido:** `test_renderArrow_zero_length_does_not_crash` — assertar que `renderArrow({type:"arrow", x:100,y:100, to:[100,100]})` retorna nó SVG sem `NaN` em atributos. Considerar clamp: `headLen = Math.min(headLen, distance * 0.4)`.

### EC-8: Freedraw com exatamente 2 pontos (mínimo do schema)

- **Task afetada:** T2.5
- **Teste sugerido:** `test_renderFreedraw_two_points_produces_valid_path` — `getStroke([[0,0],[100,0]])` precisa retornar algo renderizável; verificar que o `d` do `<path>` é não-vazio e bem-formado.

### EC-9: Multi-line text com align center precisa setar `x` em cada `<tspan>`, não `dx`

- **Task afetada:** T2.4
- **Teste sugerido:** `test_renderText_multiline_center_align_each_tspan_has_x` — verificar que cada `<tspan>` filho tem `x={baseX}` e `text-anchor="middle"`. `dx` move relativo e quebra align em multi-line.

### EC-10: Drag começa fora do `<svg>` e termina dentro (ou vice-versa)

- **Task afetada:** T3.2
- **Teste sugerido:** `test_viewport_drag_started_outside_svg_does_not_pan` — pointer down no parent, move sobre o svg: não deve iniciar pan dentro do meio do gesto.

### EC-11: `pointercancel` durante drag (system gesture, swipe-from-edge, etc.)

- **Task afetada:** T3.2
- **Teste sugerido:** `test_viewport_pointercancel_resets_drag_state` — simular sequência `pointerdown → pointermove → pointercancel`. Estado interno volta para idle.

### EC-12: `data` muda durante render (nova referência) — re-validation e re-render corretos

- **Task afetada:** T4.1
- **Teste sugerido:** `test_whiteboard_rerenders_when_data_prop_changes` — render com `data: sceneA`, depois `data: sceneB`. `getByRole("img")` reflete sceneB. Sem stale memo.

### EC-13: SSR smoke — componente renderiza sem `window`

- **Task afetada:** T4.1
- **Teste sugerido:** `test_whiteboard_ssr_renders_static_svg` — usar `renderToString` (ou simular ausência de `window` em happy-dom). Espera-se que o markup SVG inicial saia OK; pan/zoom ativa só após hydrate. Bloqueador potencial: o dynamic import de rough.js (D6) pode não funcionar em SSR.

### EC-14: `fitOnLoad` mede container via `getBoundingClientRect` em useEffect, não no render

- **Task afetada:** T4.1
- **Teste sugerido:** `test_whiteboard_fitOnLoad_uses_effect_not_render` — `getBoundingClientRect` no render dá `0` em SSR/primeiro paint. Precisa de `useEffect` + `useState` para tamanho do container.

### EC-15: `pnpm sync:exports` collision detection — auto-scan vs ISOLATED_SUBPATHS

- **Task afetada:** T0.1
- **Teste sugerido:** Já no plano (`test_buildExports_collision_with_auto_scanned_throws`). Reforçar que a mensagem de erro inclui o nome do subpath colidente para debugging fácil.

### EC-16: `validateReadmeDrift` whitelist — `Whiteboard` em backticks no README sem export do barrel

- **Task afetada:** T5.1
- **Teste sugerido:** Verificar que após T5.1 o gate `validateReadmeDrift` continua verde. Se não, adicionar `Whiteboard` à whitelist em `validate-quality-gates.ts:452-495` (já tem precedente: `Card`, `Dialog`, `ScrollArea` whitelisted).

---

## DOCUMENT

### EC-17: Hash collision do FNV-1a (1 em ~4 bilhões)

- **Risco aceito:** Para scenes de 5-50 elementos, probabilidade de colisão é desprezível. Mesmo com colisão, o output é só visualmente idêntico em dois elementos com mesmas dims — sem corrupção.

### EC-18: Caracteres RTL, emoji e fontes sem suporte hand-drawn

- **Risco aceito:** Fonte hand-drawn (`Virgil`/`Caveat`) tem suporte limitado a caracteres não-Latinos. Documentar no RFC que falls back para fonte do sistema; usuário com necessidade de árabe/japonês usa `fontFamily: "sans"`.

### EC-19: >5k elementos em uma scene degradam performance SVG

- **Risco aceito:** Explicitamente fora do escopo (ADR D1, seção "Notas sobre escopo deliberadamente NÃO incluído"). Virtualização vira RFC futuro se consumer pedir.

### EC-20: `pointer-events: none` nos elementos impede selection/copy de texto

- **Risco aceito:** Trade-off consciente do ADR D7. Quem precisar copiar texto pode setar `interactive` prop futura.

### EC-21: Versão incompatível de peer-dep (consumer instala roughjs 5.x quando declaramos `^4.6.0`)

- **Risco aceito:** Pnpm/npm emitem warning. API de rough.js historicamente é estável; major bump improvável a curto prazo. Documentar requisito de versão no RFC e no README do subpath.

### EC-22: Elementos com coordenadas fora do `width x height` da scene

- **Risco aceito:** Pan/zoom permite navegar. LLM pode "desenhar fora da página" — não é nosso job consertar. Documentar no RFC com exemplo do `fitOnLoad` resolvendo o caso comum.

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | **Risco médio** | Subpath isolado tem 3 pontos de wiring (sync-exports.ts, tsup, package.json#exports) que precisam casar. Dogfood (Phase 6) com `pnpm pack` mitiga, mas seria razoável adicionar um gate `validateIsolatedSubpath` que faz import smoke após build. |
| Correct code in wrong place | Não | Renderer puro, viewport stateful, schema separado — separação clara. |
| Project name vs ID | N/A | Sem persistência. |
| ArgoCD notifiers / Helm v7.x | N/A | Não há infra. |
| Single ArgoCD App per tenant | N/A | Não há infra. |
| CF scan apex conflicts | N/A | Sem DNS. |
| Silent fallback on error | **Risco baixo** | Validação retorna `{ok:false, errors}` mas o componente precisa decidir o que renderizar quando inválido. Plano diz "chama callback"; falta decidir o que aparece visualmente. Sugestão: render `<svg>` vazio + console.warn em dev. |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 | 1 | 0 | 1 (EC-15) | 0 |
| T0.2 | 1 | 1 (EC-1) | 0 | 0 |
| T0.3 | 1 | 0 | 0 | 1 (EC-21) |
| T0.4 | 0 | 0 | 0 | 0 |
| T0.5 | 0 | 0 | 0 | 0 |
| T0.6 | 0 | 0 | 0 | 0 |
| T1.1 | 3 | 2 (EC-3, EC-4) | 0 | 0 |
| T1.2 | 0 | 0 | 0 | 0 |
| T2.1 | 1 | 0 | 0 | 1 (EC-17) |
| T2.2 | 0 | 0 | 0 | 0 |
| T2.3 | 1 | 0 | 1 (EC-7) | 0 |
| T2.4 | 2 | 0 | 1 (EC-9) | 1 (EC-18) |
| T2.5 | 1 | 0 | 1 (EC-8) | 0 |
| T2.6 | 1 | 0 | 0 | 1 (EC-19) |
| T3.1 | 0 | 0 | 0 | 0 |
| T3.2 | 3 | 1 (EC-2) | 2 (EC-10, EC-11) | 0 |
| T4.1 | 5 | 2 (EC-5, EC-6) | 3 (EC-12, EC-13, EC-14) | 1 (EC-20) |
| T4.2 | 0 | 0 | 0 | 0 |
| T5.1 | 1 | 0 | 1 (EC-16) | 0 |
| **Total** | **22** | **6** | **10** | **6** |

---

## Recomendações antes de iniciar Phase 0

1. **Decidir EC-5** primeiro — afeta a arquitetura do subpath (Zod em deps ou opt-in). Recomendação: opção A (Zod em dependencies do subpath, ~12KB gz aceitável).
2. **Patch direto no plano** (3 linhas cada): EC-3, EC-4 entram como ajuste no schema da T1.1.
3. **Patch no plano** EC-2: T3.2 ganha menção explícita à necessidade de `addEventListener` manual.
4. **Patch no plano** EC-6: T4.1 ganha exemplo de `useEffect` para callback.
5. **Sub-task nova** T5.4.x para EC-1: adicionar `validateIsolatedBundle` ao quality gates.
6. **EC-15 (já no plano)** e **EC-16** ficam como acceptance criteria adicionais nas tasks existentes.
7. **SHOULD TEST (10)** entram como testes adicionais nos TDD cycles já planejados — sem nova task, só ampliar a lista de `RED:` em cada T relevante.
8. **DOCUMENT (6)** entram no RFC `0001-whiteboard.md` na seção "Riscos + Mitigações" (já prevista no T0.5).

Total de mudanças necessárias no plano antes da execução: **5 patches pequenos + 1 decisão de arquitetura (EC-5)**.
