// @usetheo/ui — barrel entry.

export { cn } from "./lib/cn.js";

// Primitives
export { Button, buttonVariants, type ButtonProps } from "./components/button/index.js";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge/index.js";
export { Card } from "./components/card/index.js";
export { Input, type InputProps } from "./components/input/index.js";
export { Dialog } from "./components/dialog/index.js";
export { Tabs } from "./components/tabs/index.js";
export { Tooltip } from "./components/tooltip/index.js";

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
