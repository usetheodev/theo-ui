// @theokit/ui — barrel entry.
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
  ThemeScript,
  ThemeSwitcher,
  builtinThemes,
  classicPaper,
  auroraTerminal,
  defineTheme,
  hex,
  rgb,
  useDensity,
  useTheme,
  violetForge,
  // 7 new themes (RFC 0007)
  vercelMono,
  githubDark,
  dracula,
  oneDark,
  anthropicStyle,
  openaiStyle,
  linearGlass,
  type ColorScale,
  type DefineThemeInput,
  type Density,
  type DensityContextValue,
  type Theme,
  type ThemeFonts,
  type ThemeMode,
} from "./themes/index.js";

// Primary entry point — composes ThemeProvider + Toaster (T2.1)
export { TheoUIProvider, type TheoUIProviderProps } from "./theo-ui-provider.js";

// Shared domain types
export type {
  Attachment,
  CustomContentUIPart,
  DataUIPart,
  FileUIPart,
  MessageRole,
  ProviderMetadata,
  ReasoningFileUIPart,
  ReasoningUIPart,
  SourceDocumentUIPart,
  SourceUrlUIPart,
  StepStartUIPart,
  TextUIPart,
  ToolInvocationState,
  ToolUIPart,
  UIMessage,
  UIMessagePart,
} from "./types/chat.js";
export {
  isCustomContentUIPart,
  isDataUIPart,
  isFileUIPart,
  isReasoningFileUIPart,
  isReasoningUIPart,
  isSourceDocumentUIPart,
  isSourceUrlUIPart,
  isStepStartUIPart,
  isTextUIPart,
  isToolUIPart,
} from "./types/chat.js";
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
// PRIMITIVES — atomic, do not depend on any other @theokit/ui component.
// ─────────────────────────────────────────────────────────────────────────────

// Foundations
export { Button, buttonVariants, type ButtonProps } from "./components/primitives/button/index.js";
export { Badge, badgeVariants, type BadgeProps } from "./components/primitives/badge/index.js";
// theokit-ui-parity Phase 1 — 7 new components
export {
  ThinkingLevelSelector,
  type ThinkingLevel,
  type ThinkingLevelOrInherited,
  type ThinkingLevelSelectorProps,
} from "./components/primitives/thinking-level-selector/index.js";
export {
  RunStatusPill,
  type RunStatus,
  type RunStatusPillProps,
} from "./components/primitives/run-status-pill/index.js";
export {
  BranchIndicator,
  type BranchIndicatorProps,
} from "./components/primitives/branch-indicator/index.js";
export {
  GatewayStatusIndicator,
  type GatewayStatus,
  type GatewayStatusIndicatorProps,
} from "./components/primitives/gateway-status-indicator/index.js";
export {
  UpdateBanner,
  type UpdateBannerProps,
} from "./components/primitives/update-banner/index.js";
export {
  ExportChatDialog,
  type ExportChatDialogProps,
  type ExportFormat,
} from "./components/primitives/export-chat-dialog/index.js";
export {
  StabilityBundleViewer,
  type StabilityBundle,
  type StabilityBundleViewerProps,
  type StabilitySeverity,
} from "./components/composites/stability-bundle-viewer/index.js";
export { Card } from "./components/primitives/card/index.js";
export { Input, type InputProps } from "./components/primitives/input/index.js";
export { Dialog } from "./components/primitives/dialog/index.js";
export { Tabs } from "./components/primitives/tabs/index.js";
export { Tooltip } from "./components/primitives/tooltip/index.js";
export { ScrollArea } from "./components/primitives/scroll-area/index.js";
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
export { RuleCard } from "./components/primitives/rule-card/index.js";
export type { Rule, RuleScope, RuleState } from "./types/rule.js";
export { ALL_MODES, MODE_LABEL, type Mode } from "./types/mode.js";
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
export {
  MCPServerCard,
  type MCPServer,
  type MCPServerStatus,
} from "./components/primitives/mcp-server-card/index.js";
export {
  ChannelCard,
  type Channel,
  type ChannelPlatform,
  type ChannelStatus,
} from "./components/primitives/channel-card/index.js";
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
export { AgentStreaming } from "./components/primitives/agent-streaming/index.js";
export {
  AgentErrorCard,
  type AgentErrorKind,
} from "./components/primitives/agent-error-card/index.js";
export {
  ToolCallCard,
  type ToolCallStatus,
} from "./components/primitives/tool-call-card/index.js";

// Layout shells (atomic — internal subparts only)
export { Sidebar } from "./components/primitives/sidebar/index.js";
export { TopNav } from "./components/primitives/topnav/index.js";
export { Sheet, sheetVariants } from "./components/primitives/sheet/index.js";
export {
  ProjectSwitcher,
  type ProjectStatus,
} from "./components/primitives/project-switcher/index.js";
export {
  SessionListItem,
  type SessionMode,
  type SessionRunStatus,
} from "./components/primitives/session-list-item/index.js";

// Chat atoms
export {
  ChatMessage,
  ChatMessageAction,
  ChatMessageActions,
  ChatMessageBranch,
  ChatMessageBranchContent,
  ChatMessageBranchNext,
  ChatMessageBranchPage,
  ChatMessageBranchPrevious,
  ChatMessageBranchSelector,
  ChatMessageContent,
  ChatMessageResponse,
  ChatMessageRoot,
  ChatMessageToolbar,
  DataPart,
  FilePart,
  ReasoningPart,
  SourceDocumentPart,
  SourceUrlPart,
  TextPart,
  ToolCallPart,
  renderPart,
  type ChatMessageProps,
  type ChatMessageRootProps,
  type ChatMessageContentProps,
  type ChatMessageContentVariant,
  type ChatMessageResponseProps,
  type ChatMessageActionsProps,
  type ChatMessageActionProps,
  type ChatMessageToolbarProps,
  type ChatMessageBranchProps,
  type ChatMessageBranchContentProps,
  type ChatMessageBranchSelectorProps,
  type ChatMessageBranchPreviousProps,
  type ChatMessageBranchNextProps,
  type ChatMessageBranchPageProps,
  type DataPartProps,
  type DataRenderer,
  type DataRendererMap,
  type FilePartProps,
  type PartRendererMap,
  type ReasoningPartProps,
  type RenderPartOptions,
  type SourceDocumentPartProps,
  type SourceUrlPartProps,
  type TextPartProps,
  type ToolCallPartProps,
} from "./components/composites/chat-message/index.js";
export { ChatThread } from "./components/primitives/chat-thread/index.js";
export { ModelSelector, type ModelOption } from "./components/primitives/model-selector/index.js";
export {
  IntentSelector,
  type IntentOption,
} from "./components/primitives/intent-selector/index.js";
export {
  MentionMenu,
  type MentionItem,
  type MentionTrigger,
} from "./components/primitives/mention-menu/index.js";
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

// PaaS-shape primitives + composites (RFC dashboard-paas-primitives, 0.7.0-next.0)
// Sibling components for cloud-dashboard surfaces — distinct from the
// agent-first siblings (CostMeter, Badge, ProjectSwitcher) so both
// shapes can coexist without API widening. UsageMeter + AccountMenu are
// composites (depend on sibling primitives — Progress / Avatar+PlanBadge);
// Progress + PlanBadge are standalone primitives.
export { Progress, type ProgressProps } from "./components/primitives/progress/index.js";
export {
  PlanBadge,
  type PlanBadgeProps,
  type PlanTier,
} from "./components/primitives/plan-badge/index.js";
export {
  UsageMeter,
  type UsageMeterProps,
  type UsageMetric,
} from "./components/composites/usage-meter/index.js";
export {
  AccountMenu,
  type AccountMenuProps,
} from "./components/composites/account-menu/index.js";

// Cross-cutting PaaS primitives (RFC dashboard-paas-primitives-2, 0.8.0-next.0)
// Brief #2 — 8 components closing the cross-cutting gaps surfaced by the
// TheoCloud dashboard migration. 6 primitives + 2 composites (ConfirmDialog
// depends on Dialog/Input/Button; CodeBlock depends on CopyButton).
export {
  Table,
  type TableProps,
  type TableCellProps,
  type TableHeaderCellProps,
} from "./components/primitives/table/index.js";
export {
  StatusDot,
  type StatusDotProps,
  type StatusKind,
} from "./components/primitives/status-dot/index.js";
export {
  CopyButton,
  type CopyButtonProps,
} from "./components/primitives/copy-button/index.js";
export { Timestamp, type TimestampProps } from "./components/primitives/timestamp/index.js";
export { StatTile, type StatTileProps } from "./components/primitives/stat-tile/index.js";
export {
  DangerZone,
  type DangerZoneProps,
  type DangerZoneActionProps,
} from "./components/primitives/danger-zone/index.js";
export {
  ConfirmDialog,
  type ConfirmDialogProps,
} from "./components/composites/confirm-dialog/index.js";
export { CodeBlock, type CodeBlockProps } from "./components/composites/code-block/index.js";

// StatusIndicator composite — operational state, consumes status-* tokens (ADR-0007).
// Plan: theo-ui-community-best-practices-alignment T4.1.
export {
  StatusIndicator,
  type StatusIndicatorKind,
  type StatusIndicatorProps,
  type StatusIndicatorSize,
} from "./components/composites/status-indicator/index.js";

// MetricCard composite — dashboard metric tile with trend semantics + invertTrend (EC-17).
// Plan: theo-ui-community-best-practices-alignment T4.2.
export {
  MetricCard,
  type MetricCardDelta,
  type MetricCardProps,
  type MetricCardTrend,
} from "./components/composites/metric-card/index.js";

// Brief #3 deferred primitives (0.9.0-next.0)
export { Alert, type AlertProps, type AlertIntent } from "./components/primitives/alert/index.js";
export {
  Pagination,
  computePageRange,
  type PaginationProps,
} from "./components/primitives/pagination/index.js";

// Brief #5 — 3 dashboard primitives + 2 pre-reqs (0.11.0-next.0)
// Closes 3 TheoCloud Deep Review findings (§ 2.12 P2, § 2.2 + § 2.4 P1
// Top-5 fix #2, CC-3 boilerplate dedup). DropdownMenu + ActionBar
// added as explicit pre-reqs (Brief #5 assumed they existed).
export { DropdownMenu } from "./components/primitives/dropdown-menu/index.js";
export { ActionBar, type ActionBarProps } from "./components/primitives/action-bar/index.js";
export { PinInput, type PinInputProps } from "./components/primitives/pin-input/index.js";
export {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  type DataTableSort,
} from "./components/composites/data-table/index.js";
export { PageShell, type PageShellProps } from "./components/composites/page-shell/index.js";

// Files & folder context atoms
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

// Configuration & registry composites (skill, rule, MCP server, cron job, agent editors and lists)
// Previously mis-grouped under PRIMITIVES. Mechanically these are composites
// because they import primitives via the barrel (T2.4, MF-1 of edge review).
export { SkillsList } from "./components/composites/skills-list/index.js";
export { SkillEditor } from "./components/composites/skill-editor/index.js";
export { RuleEditor } from "./components/composites/rule-editor/index.js";
export { CronJobsList } from "./components/composites/cron-jobs-list/index.js";
export { MCPServerList } from "./components/composites/mcp-server-list/index.js";
export {
  AgentEditor,
  type AgentDraft,
} from "./components/composites/agent-editor/index.js";
export {
  ApprovalCard,
  type ApprovalSeverity,
} from "./components/composites/approval-card/index.js";

// Prompt composites — ask-the-user cards (one question at a time)
export {
  ChoicePrompt,
  type ChoicePromptProps,
  type ChoicePromptResult,
  type PromptOption,
} from "./components/composites/choice-prompt/index.js";
export {
  MultiSelectPrompt,
  type MultiSelectPromptProps,
  type MultiSelectPromptResult,
} from "./components/composites/multi-select-prompt/index.js";
export {
  TextPrompt,
  type TextPromptProps,
  type TextPromptResult,
} from "./components/composites/text-prompt/index.js";
export {
  ConfirmPrompt,
  type ConfirmPromptProps,
} from "./components/composites/confirm-prompt/index.js";

// Chat composites
export {
  ChatComposer,
  type ComposerMode,
} from "./components/composites/chat-composer/index.js";
export { AgentComposer } from "./components/composites/agent-composer/index.js";
export {
  AgentStream,
  type AgentStreamItem,
} from "./components/composites/agent-stream/index.js";

// Agent composites
export { AgentTimeline } from "./components/composites/agent-timeline/index.js";
export { TaskHeader } from "./components/composites/task-header/index.js";

// Permission & approval composites
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
