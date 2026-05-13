// @usetheo/ui — barrel entry.
//
// Architecture (see docs/architecture.md):
//   - lib/         pure utilities (cn) — no React state
//   - themes/      theme registry + ThemeProvider + ThemeSwitcher
//   - components/
//       primitives/   atomic components: only depend on Radix, lucide, cn
//       composites/   compose primitives: depend on >=1 other component here
//   - types/       shared domain models (Message, AgentEvent, …)
//   - screens/     example screen compositions (stories only, not exported)

export { cn } from "./lib/cn.js";

// Theme system
export {
  ThemeProvider,
  ThemeSwitcher,
  builtinThemes,
  classicPaper,
  auroraTerminal,
  useTheme,
  violetForge,
  type ColorScale,
  type Theme,
  type ThemeFonts,
  type ThemeMode,
} from "./themes/index.js";

// Shared domain types
export type { Attachment, Message, MessageRole } from "./types/chat.js";
export type {
  AgentEvent as AgentEventModel,
  AgentEventStatus,
  AgentEventType,
} from "./types/agent.js";
export type {
  PermissionDecision,
  PermissionOperation,
  PermissionRequest,
} from "./types/permission.js";
export type { TaskStatus, TaskStep, TaskStepStatus } from "./types/task.js";

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES — atomic, do not depend on any other @usetheo/ui component.
// ─────────────────────────────────────────────────────────────────────────────

// Foundations
export { Button, buttonVariants, type ButtonProps } from "./components/primitives/button/index.js";
export { Badge, badgeVariants, type BadgeProps } from "./components/primitives/badge/index.js";
export { Card } from "./components/primitives/card/index.js";
export { Input, type InputProps } from "./components/primitives/input/index.js";
export { Dialog } from "./components/primitives/dialog/index.js";
export { Tabs } from "./components/primitives/tabs/index.js";
export { Tooltip } from "./components/primitives/tooltip/index.js";
export { ScrollArea, ScrollBar } from "./components/primitives/scroll-area/index.js";
export {
  Toast,
  type ToastVariant,
  Toaster,
  useToast,
} from "./components/primitives/toast/index.js";
export { Skeleton } from "./components/primitives/skeleton/index.js";
export { Avatar, avatarVariants } from "./components/primitives/avatar/index.js";
export { Label } from "./components/primitives/label/index.js";
export { FormField } from "./components/primitives/form-field/index.js";
export { EmptyState } from "./components/primitives/empty-state/index.js";
export { Select } from "./components/primitives/select/index.js";
export { Checkbox } from "./components/primitives/checkbox/index.js";
export { RadioGroup } from "./components/primitives/radio-group/index.js";
export { Switch } from "./components/primitives/switch/index.js";
export { Textarea, type TextareaProps } from "./components/primitives/textarea/index.js";

// Agent transparency & configuration primitives
export { ContextWindowBar } from "./components/primitives/context-window-bar/index.js";
export {
  CapabilityIndicator,
  capabilityPresets,
  type Capability,
  type CapabilityState,
} from "./components/primitives/capability-indicator/index.js";
export {
  ToolsList,
  type ToolEnablement,
  type ToolEntry,
} from "./components/primitives/tools-list/index.js";
export {
  PermissionMatrix,
  type PermissionDecisionKind,
  type PermissionRule,
} from "./components/primitives/permission-matrix/index.js";
export {
  SkillCard,
  type Skill,
  type SkillSource,
  type SkillState,
} from "./components/primitives/skill-card/index.js";
export { SkillsList } from "./components/primitives/skills-list/index.js";
export { CostMeter } from "./components/primitives/cost-meter/index.js";
export {
  TaskNode,
  TaskPlan,
  type PlanNode,
  type PlanNodeStatus,
} from "./components/primitives/task-plan/index.js";
export { SystemPromptEditor } from "./components/primitives/system-prompt-editor/index.js";
export {
  MemoryEditor,
  type MemoryLayer,
  type MemoryScope,
} from "./components/primitives/memory-editor/index.js";
export {
  HookConfig,
  HOOK_EVENTS,
  type HookEntry,
  type HookEvent,
} from "./components/primitives/hook-config/index.js";
export {
  HookEventLog,
  type HookEventEntry,
  type HookEventResult,
} from "./components/primitives/hook-event-log/index.js";
export {
  CronJobCard,
  type CronJob,
  type CronJobStatus,
} from "./components/primitives/cron-job-card/index.js";
export { CronJobsList } from "./components/primitives/cron-jobs-list/index.js";
export {
  MCPServerCard,
  type MCPServer,
  type MCPServerStatus,
} from "./components/primitives/mcp-server-card/index.js";
export { MCPServerList } from "./components/primitives/mcp-server-list/index.js";
export {
  ModelCard,
  modelCapabilityPresets,
  type ModelCapabilityFlag,
  type ModelInfo,
} from "./components/primitives/model-card/index.js";

// Sprint 3 — multi-agent & advanced transparency
export {
  AgentProfile,
  type AgentProfileDescriptor,
} from "./components/primitives/agent-profile/index.js";
export {
  SubAgentDispatch,
  type SubAgentRun,
  type SubAgentState,
} from "./components/primitives/sub-agent-dispatch/index.js";
export {
  SessionTimeline,
  type SessionStatus,
  type SessionSummary,
} from "./components/primitives/session-timeline/index.js";
export {
  AuditLogEntry,
  type AuditActorKind,
  type AuditEntry,
  type AuditSeverity,
} from "./components/primitives/audit-log-entry/index.js";
export {
  LaneBoard,
  type Lane,
  type LaneCard,
  type LaneState,
} from "./components/primitives/lane-board/index.js";
export {
  TokenUsageChart,
  type TokenUsagePoint,
} from "./components/primitives/token-usage-chart/index.js";
export { AutoCompactNotice } from "./components/primitives/auto-compact-notice/index.js";
export { AgentHandoff, type HandoffParty } from "./components/primitives/agent-handoff/index.js";

// Layout shells (atomic — internal subparts only)
export { Sidebar } from "./components/primitives/sidebar/index.js";
export { TopNav } from "./components/primitives/topnav/index.js";

// Chat atoms
export { ChatMessage } from "./components/primitives/chat-message/index.js";
export { ChatThread } from "./components/primitives/chat-thread/index.js";
export { ModelSelector, type ModelOption } from "./components/primitives/model-selector/index.js";
export { FolderSelector } from "./components/primitives/folder-selector/index.js";
export { AttachmentChip } from "./components/primitives/attachment-chip/index.js";
export {
  QuickActionChips,
  type QuickAction,
} from "./components/primitives/quick-action-chips/index.js";

// Agent atoms
export { AgentEvent } from "./components/primitives/agent-event/index.js";
export { AgentStartingState } from "./components/primitives/agent-starting-state/index.js";
export { RunStats } from "./components/primitives/run-stats/index.js";
export { ToolCall } from "./components/primitives/tool-call/index.js";
export { ToolResult } from "./components/primitives/tool-result/index.js";

// Cowork atoms
export { ProgressChecklist } from "./components/primitives/progress-checklist/index.js";
export {
  FolderContextCard,
  type FolderEntry,
} from "./components/primitives/folder-context-card/index.js";
export { ContextCard } from "./components/primitives/context-card/index.js";
export {
  CreatedFilesCard,
  type CreatedFile,
} from "./components/primitives/created-files-card/index.js";
export { ArtifactPreview } from "./components/primitives/artifact-preview/index.js";
export { StepsRail, type RailStep } from "./components/primitives/steps-rail/index.js";
export {
  RecentFoldersList,
  type RecentFolder,
} from "./components/primitives/recent-folders-list/index.js";

// Code workspace atoms
export {
  DiffViewer,
  type DiffHunk,
  type DiffLine,
  type DiffLineKind,
} from "./components/primitives/diff-viewer/index.js";
export {
  TerminalPanel,
  type TerminalLine,
} from "./components/primitives/terminal-panel/index.js";
export {
  RunningTasksPanel,
  type RunningTaskItem,
  type RunningTaskStatus,
  type TaskSource,
} from "./components/primitives/running-tasks-panel/index.js";
export { BrowserControls } from "./components/primitives/browser-controls/index.js";
export {
  BuildLogStream,
  type LogLevel,
  type LogLine,
} from "./components/primitives/build-log-stream/index.js";
export { MetricsPanel, type Metric } from "./components/primitives/metrics-panel/index.js";

// Auth atoms
export {
  SocialAuthRow,
  type SocialProvider,
} from "./components/primitives/social-auth-row/index.js";
export { LoginSplit } from "./components/primitives/login-split/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITES — depend on one or more primitives above.
// ─────────────────────────────────────────────────────────────────────────────

// Chat composites
export {
  ChatComposer,
  type ComposerMode,
} from "./components/composites/chat-composer/index.js";

// Agent composites
export { AgentTimeline } from "./components/composites/agent-timeline/index.js";
export { TaskHeader } from "./components/composites/task-header/index.js";

// Cowork composites
export { PermissionModal } from "./components/composites/permission-modal/index.js";

// Code workspace composites
export { PreviewPanel } from "./components/composites/preview-panel/index.js";

// PaaS composites
export {
  DeploymentRow,
  type Deployment,
  type DeploymentStatus,
} from "./components/composites/deployment-row/index.js";
export { ProjectCard, type Project } from "./components/composites/project-card/index.js";
export {
  EnvVarEditor,
  type EnvScope,
  type EnvVar,
} from "./components/composites/env-var-editor/index.js";
export {
  PreviewEnvCard,
  type PreviewEnv,
  type PreviewService,
} from "./components/composites/preview-env-card/index.js";
export {
  DomainConfig,
  type Domain,
  type DomainStatus,
} from "./components/composites/domain-config/index.js";
export {
  RollbackUI,
  type RollbackTarget,
} from "./components/composites/rollback-ui/index.js";

// Globals
export {
  CommandPalette,
  type CommandItem,
} from "./components/composites/command-palette/index.js";
