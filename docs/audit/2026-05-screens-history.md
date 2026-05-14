# TheoKit — Composição das Telas em Componentes

> Mapeamento normativo: para cada tela de referência (`referencia/stitch/*` + `referencia/WIREMOCKS.md`), decompõe em componentes atômicos, identifica reuso e prioriza implementação.
>
> Os componentes já entregues (Fases 6 e 7) são marcados com ✅. O resto entra nas Fases 8.1–8.4.

---

## Princípios de componentização

1. **Atomic + composição**: primitivos (Button, Input, Badge) ← compostos de domínio (ChatMessage, AgentEvent) ← composições de tela (`screens/`). Cada nível só conhece o anterior.
2. **Stateless por padrão**: componentes recebem dados via props, emitem callbacks. Nenhum fetch interno.
3. **Type-safe domain models**: cada tela compartilha tipos canônicos (`Message`, `AgentEvent`, `Permission`, etc.) exportados no barrel.
4. **Acessibilidade por design**: roles, aria-labels, focus trap (no PermissionModal), arrow-key navigation (nos menus).
5. **Modo dual light/dark**: cada componente respeita o `data-theme` da página. Tokens HSL no design system permitem isso sem prop interna.

---

## Inventário das telas (referencia/)

| Tela | Modo | Função | Arquivo de referência |
|---|---|---|---|
| 1. Code Mode Workspace | Code (dark) | Dev assistido por agente: timeline + diff + terminal + tasks | `stitch/code_workspace_theo_style_dark/screen.png` |
| 2. Cowork Task Completed | Cowork | Tarefa concluída com artefato (planilha XLSX) | `WIREMOCKS.md §2` |
| 3. Cowork Task Running | Cowork | Tarefa em execução com progresso real + verify rows | `stitch/task_completion_theo_style/screen.png` |
| 4. Cowork Starting | Cowork | Estado bootstrapping com spinner | `WIREMOCKS.md §4` |
| 5. Permission Modal | Modal | Pedido de permissão de acesso a arquivos locais | `WIREMOCKS.md §5` |
| 6. Cowork Home | Cowork | Tela inicial seleção de pasta + prompt | `stitch/cowork_home_theo_style/screen.png` |
| 7. Chat Home | Chat | Tela inicial conversacional com sidebar de conversas | `stitch/chat_home_theo_style/screen.png` |
| 8. Login Split | Auth | Login 50/50 com ilustração brutalista | `stitch/login_theo_style_split/screen.png` |
| 9. Menu Variations | Cowork | Cowork com working directory selector + Cmd+K | `stitch/menu_variations_theo_style/screen.png` |

---

## Decomposição por tela

### 1. Code Mode Workspace (dark)

```
CodeWorkspaceScreen
├─ Sidebar ✅
│   ├─ Sidebar.Header (logo + project)
│   ├─ Sidebar.Section "Sessions"
│   │   └─ Sidebar.Item (active = current session)
│   ├─ Sidebar.Section "Recent" (truncated list)
│   └─ Sidebar.Footer (Settings icon)
├─ TopNav ✅
│   ├─ Breadcrumb: project / task
│   ├─ ModeSwitcher (Chat | Cowork | Code)  ✅
│   └─ Right: PROJECT: ACTIVE badge ✅ + actions
├─ AgentTimeline  🆕  (center column)
│   ├─ ConstraintsTable  🆕  (rect-b, circle, bar-h…)
│   ├─ AgentEvent ×N  🆕  (Start dev server, Edit X.tsx +85 -12, Lint, Build…)
│   ├─ ChatMessage  🆕  (user feedback bubble: "easing feels bouncy")
│   ├─ ChatMessage  🆕  (assistant: "Swapping back-out curve…")
│   ├─ AgentEvent.Group "Action list" (multiple edits)  🆕
│   ├─ RunStats  🆕  (• 24s ↓ 35.7k tokens)
│   ├─ DeploymentRow ✅ used as "branch → claude/alignment-grid +966 -55 [Create PR]"
│   └─ CodeComposer  🆕  (Type / for commands + Auto accept + model)
└─ Workbench (right column, 40%)
    ├─ PreviewPanel  🆕
    │   ├─ BrowserControls (back/forward/refresh + URL)
    │   └─ LogStreamSearch (filters + BuildLogStream ✅)
    ├─ DiffViewer  🆕  (red/green lines, collapsed unchanged)
    ├─ TerminalPanel  🆕
    └─ RunningTasksPanel  🆕  (Running: Agent/Bash · Completed)
```

### 2 & 3. Cowork Task Running / Completed

```
TaskScreen
├─ TopNav ✅ with ModeSwitcher
├─ Sidebar ✅
│   ├─ Sidebar.Item "+ Novo item"
│   ├─ Sidebar.Item Procurar / Recentes / Projetos
│   ├─ Sidebar.Section "Recentes" (task list)
│   └─ Sidebar.Footer (avatar + plan)
├─ Main (chat-like center)
│   ├─ TaskHeader  🆕  (title + chevron)
│   ├─ ChatMessage  🆕  user prompt bubble
│   ├─ ToolCall  🆕  "Executou 2 comandos >" (collapsible)
│   ├─ ChatMessage  🆕  assistant "São 18 imagens! Vou analisar…"
│   ├─ ToolCall  🆕  "Leu 18 arquivos >"
│   ├─ ChatMessage  🆕  assistant with category list
│   ├─ ArtifactPreview  🆕  (XLSX preview with verify rows)  // Completed only
│   ├─ CreatedFilesCard  🆕  // Completed only
│   └─ ChatComposer  🆕  (Cowork variant with folder path)
└─ RightInspector  🆕
    ├─ ProgressChecklist  🆕  (✓ Criar / ✓ Mover / ✓ Verificar)
    ├─ FolderContextCard  🆕  (folder tree fragment)
    └─ ContextCard  🆕  (tools/files referenced)
```

### 4. Cowork Starting (bootstrapping state)

```
TaskScreen (same shell as #3)
└─ Main
    ├─ TaskHeader  🆕
    ├─ ChatMessage  🆕  user bubble
    ├─ AgentStartingState  🆕  (spinner + "Starting up…")
    └─ ChatComposer  🆕  (with [stop] [Fila] buttons)
```

### 5. Permission Modal

```
PermissionModal  🆕   (built on Dialog ✅)
├─ Dialog.Title "Permitir que Claude altere arquivos em <path>?"
├─ Dialog.Body  Scope + risk explanation
└─ Dialog.Footer
    ├─ Button secondary "Cancelar"
    ├─ Button ghost "Sempre permitir"  // intermediate level
    └─ Button primary "Permitir"
```

### 6. Cowork Home

```
CoworkHomeScreen
├─ TopNav ✅ with ModeSwitcher
├─ Sidebar ✅
├─ Hero
│   ├─ HeroTitle "Vamos riscar algo da sua lista"
│   ├─ ChatComposer  🆕  Cowork variant
│   │   ├─ FolderSelector  🆕  (C:\…\capturas)
│   │   ├─ Textarea prompt
│   │   ├─ AttachmentButton
│   │   ├─ ModelSelector  🆕
│   │   └─ Mic button
│   ├─ QuickActionChips  🆕  (Escrever / Aprender / Código / Assuntos pessoais)
│   └─ AccentCallout "Escolha do Claude"
└─ StepsRail  🆕  (vertical 1-5 with line)
```

### 7. Chat Home

```
ChatHomeScreen
├─ TopNav ✅ ModeSwitcher
├─ Sidebar ✅
│   ├─ Sidebar.Section: Conversas / Projetos / Artefatos
│   └─ Sidebar.Section "Recentes" (long list, truncated text)
├─ Hero
│   ├─ Logo mark + greeting "De volta ao trabalho, Alfredo?"
│   ├─ ChatComposer  🆕  Chat variant (no folder)
│   └─ QuickActionChips  🆕  + ChoiceCTA  🆕  ("Escolha do Claude")
```

### 8. Login Split

```
LoginSplitScreen  🆕
├─ Left pane (form)
│   ├─ BrandMark "TheoBrutal" / "TheoKit"
│   ├─ HeroTitle "Welcome back"
│   ├─ SocialAuthRow  🆕  (Google + GitHub)
│   ├─ Divider "OR EMAIL"
│   ├─ EmailField (Input ✅)
│   ├─ PasswordField + "Forgot password" link
│   ├─ Button primary "SIGN IN" full-width
│   └─ Footer link "Don't have an account? Create account"
└─ Right pane (illustration)
    ├─ Heading "DESIGN LAB"
    ├─ 3D illustration slot
    └─ Caption card "Engineered for Precision"
```

### 9. Menu Variations (Cowork with explicit working directory)

```
CoworkHomeScreen variant
├─ Same shell as #6
├─ Center: WorkingDirectorySelector  🆕
│   ├─ Hero title "Cowork Mode: Execute Local Tasks"
│   ├─ Textarea (large)
│   ├─ FolderSelector with dropdown "Choose a folder…"
│   └─ RecentFoldersList  🆕  (Downloads, Docs/Projects, Desktop, Code/my-app)
├─ Bottom: CommandPalette  🆕  (Cmd+K trigger)
└─ Right: ProgressInspector  🆕  with skeleton states (Task 1, Task 2, Waiting for input)
```

---

## Componentes novos a implementar (consolidados)

Ordenados por dependência (dependentes embaixo):

### 1. Chat primitives (atoms para conversação)
- **ChatMessage**: variantes `user` (bubble), `assistant` (card), `system` (callout)
- **ChatThread**: container que aplica spacing + scroll
- **ChatComposer**: 3 variantes via prop `mode`: `chat` / `cowork` / `code`
- **AttachmentChip**: arquivo anexado com nome + size + remove
- **ModelSelector**: chip dropdown ("Sonnet 4.6 ▼")
- **FolderSelector**: chip dropdown com path + folder icon (Cowork)

### 2. Agent timeline
- **AgentEvent**: tipos `command | file_read | file_write | edit | lint | typecheck | build | tool`
  - props: `status (pending|running|success|failed)`, `label`, `path?`, `diffStats?`, `collapsible`
- **AgentTimeline**: container ordenado, line vertical, dot por evento
- **AgentEventGroup**: agrupar N eventos relacionados em uma linha colapsável
- **RunStats**: métricas inline (duração, tokens, files changed)
- **ConstraintsTable**: tabela densa de constraints/detectados (rect-b, circle…)
- **AgentStartingState**: spinner + "Starting up…" + copy do bootstrapping
- **TaskHeader**: título com chevron dropdown + meta

### 3. Tool execution UI
- **ToolCall**: linha colapsável "Executou 2 comandos >" — chevron expand
- **ToolResult**: payload formatado de uma tool (read/write/exec)

### 4. Cowork-specific
- **PermissionModal**: composto sobre Dialog com 3 ações (Cancel/Always allow/Allow)
- **ProgressChecklist**: lista vertical de etapas com tone success/primary/muted
- **FolderContextCard**: card com folder icon + lista de arquivos
- **ContextCard**: ilustração + texto explicativo (tools/files referenced)
- **CreatedFilesCard**: card com ícone de arquivo + destino (Google Drive / local)
- **ArtifactPreview**: container para preview (spreadsheet, PDF, image) com toolbar
- **StepsRail**: rail vertical numerado 1-N
- **WorkingDirectorySelector**: explicit folder picker com recent folders
- **RecentFoldersList**: lista de pastas recentes

### 5. Code workspace
- **DiffViewer**: linhas +/- com line numbers, collapsed unchanged sections
- **TerminalPanel**: cabeçalho + prompt + scroll
- **RunningTasksPanel**: 2 seções (Running / Completed), source badge (Agent | Bash)
- **PreviewPanel**: browser controls + iframe slot + log stream integrado
- **BrowserControls**: back/forward/refresh + URL bar

### 6. Auth
- **LoginSplit**: shell 50/50
- **SocialAuthRow**: linha de provedores (Google, GitHub, …)

### 7. Globals que faltavam
- **CommandPalette**: trigger Cmd+K + dialog com input + lista filtrada
- **QuickActionChips**: linha de chips de intenção
- **HeroTitle / HeroGreeting**: títulos de hero com balance

---

## Ordem de implementação proposta

**Fase 8.1 (chat core)** — base de tudo:
1. ChatMessage, ChatThread
2. ChatComposer + ModelSelector + FolderSelector + AttachmentChip
3. QuickActionChips

**Fase 8.2 (agent UI)**:
4. AgentEvent, AgentTimeline, AgentEventGroup
5. RunStats, TaskHeader, AgentStartingState
6. ToolCall, ToolResult

**Fase 8.3 (cowork)**:
7. PermissionModal (sobre Dialog)
8. ProgressChecklist, FolderContextCard, ContextCard
9. CreatedFilesCard, ArtifactPreview
10. StepsRail, WorkingDirectorySelector, RecentFoldersList

**Fase 8.4 (code workspace)**:
11. DiffViewer, TerminalPanel, RunningTasksPanel
12. PreviewPanel, BrowserControls

**Fase 8.5 (auth + globals)**:
13. LoginSplit, SocialAuthRow
14. CommandPalette

**Fase 8.6 (composições de tela)** — apenas stories no Ladle, montadas a partir dos primitivos acima:
- ChatHomeScreen
- CoworkHomeScreen (2 variantes: simples + WorkingDirectory)
- TaskRunningScreen, TaskStartingScreen, TaskCompletedScreen
- CodeWorkspaceScreen
- LoginScreen

---

## Tipos compartilhados (domain models)

Esses interfaces ficam em `src/types/` e são reaproveitados:

```ts
// src/types/chat.ts
export type MessageRole = "user" | "assistant" | "system";
export interface Message {
  id: string;
  role: MessageRole;
  content: string | React.ReactNode;
  timestamp: string;
  model?: string;            // "Opus 4.6", "Sonnet 4.6"
  attachments?: Attachment[];
}
export interface Attachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
}

// src/types/agent.ts
export type AgentEventType =
  | "command" | "file_read" | "file_write" | "edit"
  | "lint" | "typecheck" | "build" | "tool";
export type AgentEventStatus = "pending" | "running" | "success" | "failed";
export interface AgentEvent {
  id: string;
  type: AgentEventType;
  label: string;
  path?: string;
  diff?: { added: number; removed: number };
  status: AgentEventStatus;
  timestamp?: string;
  detail?: React.ReactNode;
}

// src/types/permission.ts
export type PermissionDecision = "denied" | "allowed_once" | "always_allowed";
export interface PermissionRequest {
  path: string;
  operations: Array<"read" | "write" | "delete">;
}

// src/types/task.ts
export type TaskStatus =
  | "idle" | "permission_required" | "starting"
  | "running" | "verifying" | "completed" | "failed";
export interface TaskStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done";
  progress?: number;       // 0..1 for in-progress steps
}
```

---

## Trade-offs e decisões

1. **ChatComposer com prop `mode` vs 3 componentes**: escolhemos uma prop `mode` porque os 3 variantes compartilham 80% (textarea + send + model selector). As 20% específicas (folder, slash commands, auto-accept toggle) entram via slots.
2. **AgentEvent é uma família grande** — implementamos como componente único polimórfico em vez de 8 componentes separados. Status pluga em Badge.Dot ✅.
3. **DiffViewer** não usa lib externa (diff2html, react-diff-viewer) — implementação própria 100% Tailwind para registry copy-pasteável. Não é syntax-highlighted; consumer pode embed `<pre>` com seu próprio highlighter.
4. **CommandPalette** usa Radix `Dialog` por baixo + Input ✅ — sem `cmdk` dep, mantém footprint baixo. Consumer pluga fuzzy search via callback.
5. **ArtifactPreview** é um shell genérico — caller renderiza o conteúdo (spreadsheet via lib externa, PDF via `<embed>`, image via `<img>`). Component só cuida de toolbar + frame.
6. **Composições de tela** são **stories no Ladle, não componentes exportados**. Apps consumidores montam suas próprias telas a partir dos primitivos. Isso evita lock-in de layout específico.

---

## Sucesso

Concluído quando:
- Todos os componentes 🆕 listados existem em `src/components/<kebab>/`.
- Cada um tem `index.ts`, `.tsx`, `.test.tsx`, `.stories.tsx`.
- Stories de composição em `src/screens/*.stories.tsx` montam as 7 telas-base usando só componentes da própria biblioteca.
- `pnpm typecheck` + `pnpm test` + `pnpm build` verdes.
- Cada componente tem registry descriptor em `registry/<name>.json`.
