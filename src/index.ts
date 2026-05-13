// @usetheo/ui — barrel entry.

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

// Primitives
export { Button, buttonVariants, type ButtonProps } from "./components/button/index.js";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge/index.js";
export { Card } from "./components/card/index.js";
export { Input, type InputProps } from "./components/input/index.js";
export { Dialog } from "./components/dialog/index.js";
export { Tabs } from "./components/tabs/index.js";
export { Tooltip } from "./components/tooltip/index.js";
export { ScrollArea, ScrollBar } from "./components/scroll-area/index.js";

// Layout shells
export { Sidebar } from "./components/sidebar/index.js";
export { TopNav } from "./components/topnav/index.js";

// PaaS composites
export {
  DeploymentRow,
  type Deployment,
  type DeploymentStatus,
} from "./components/deployment-row/index.js";
export {
  BuildLogStream,
  type LogLevel,
  type LogLine,
} from "./components/build-log-stream/index.js";
export { ProjectCard, type Project } from "./components/project-card/index.js";
export { MetricsPanel, type Metric } from "./components/metrics-panel/index.js";
export {
  EnvVarEditor,
  type EnvScope,
  type EnvVar,
} from "./components/env-var-editor/index.js";
export {
  PreviewEnvCard,
  type PreviewEnv,
  type PreviewService,
} from "./components/preview-env-card/index.js";
export {
  DomainConfig,
  type Domain,
  type DomainStatus,
} from "./components/domain-config/index.js";
export { RollbackUI, type RollbackTarget } from "./components/rollback-ui/index.js";

// Chat primitives
export { ChatMessage } from "./components/chat-message/index.js";
export { ChatThread } from "./components/chat-thread/index.js";
export { ChatComposer, type ComposerMode } from "./components/chat-composer/index.js";
export { ModelSelector, type ModelOption } from "./components/model-selector/index.js";
export { FolderSelector } from "./components/folder-selector/index.js";
export { AttachmentChip } from "./components/attachment-chip/index.js";
export { QuickActionChips, type QuickAction } from "./components/quick-action-chips/index.js";

// Agent UI
export { AgentEvent } from "./components/agent-event/index.js";
export { AgentTimeline } from "./components/agent-timeline/index.js";
export { RunStats } from "./components/run-stats/index.js";
export { TaskHeader } from "./components/task-header/index.js";
export { AgentStartingState } from "./components/agent-starting-state/index.js";
export { ToolCall } from "./components/tool-call/index.js";
export { ToolResult } from "./components/tool-result/index.js";

// Cowork
export { PermissionModal } from "./components/permission-modal/index.js";
export { ProgressChecklist } from "./components/progress-checklist/index.js";
export {
  FolderContextCard,
  type FolderEntry,
} from "./components/folder-context-card/index.js";
export { ContextCard } from "./components/context-card/index.js";
export {
  CreatedFilesCard,
  type CreatedFile,
} from "./components/created-files-card/index.js";
export { ArtifactPreview } from "./components/artifact-preview/index.js";
export { StepsRail, type RailStep } from "./components/steps-rail/index.js";
export {
  RecentFoldersList,
  type RecentFolder,
} from "./components/recent-folders-list/index.js";

// Code workspace
export {
  DiffViewer,
  type DiffHunk,
  type DiffLine,
  type DiffLineKind,
} from "./components/diff-viewer/index.js";
export { TerminalPanel, type TerminalLine } from "./components/terminal-panel/index.js";
export {
  RunningTasksPanel,
  type RunningTaskItem,
  type RunningTaskStatus,
  type TaskSource,
} from "./components/running-tasks-panel/index.js";
export { BrowserControls } from "./components/browser-controls/index.js";
export { PreviewPanel } from "./components/preview-panel/index.js";

// Globals
export { CommandPalette, type CommandItem } from "./components/command-palette/index.js";

// Auth
export { SocialAuthRow, type SocialProvider } from "./components/social-auth-row/index.js";
export { LoginSplit } from "./components/login-split/index.js";
