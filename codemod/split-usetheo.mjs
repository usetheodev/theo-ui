#!/usr/bin/env node
// Codemod: rewrite imports of moved components from @theokit/ui to @usetheo/ui.
// Pivot v1 (AI-exclusive split). Usage: node split-usetheo.mjs <file...>
import { readFileSync, writeFileSync } from "node:fs";

const MOVED = new Set([
  "AccountMenu",
  "AccountMenuProps",
  "ActionBar",
  "ActionBarProps",
  "Alert",
  "AlertIntent",
  "AlertProps",
  "Avatar",
  "Badge",
  "BadgeProps",
  "Button",
  "ButtonProps",
  "Card",
  "Checkbox",
  "CodeBlock",
  "CodeBlockProps",
  "CommandItem",
  "CommandPalette",
  "ConfirmDialog",
  "ConfirmDialogProps",
  "CopyButton",
  "CopyButtonProps",
  "DangerZone",
  "DangerZoneActionProps",
  "DangerZoneProps",
  "DataTable",
  "DataTableColumn",
  "DataTableProps",
  "DataTableSort",
  "Deployment",
  "DeploymentRow",
  "DeploymentStatus",
  "Dialog",
  "Domain",
  "DomainConfig",
  "DomainStatus",
  "DropdownMenu",
  "EmptyState",
  "EnvScope",
  "EnvVar",
  "EnvVarEditor",
  "FormField",
  "Input",
  "InputProps",
  "Label",
  "LoginSplit",
  "Metric",
  "MetricCard",
  "MetricCardDelta",
  "MetricCardProps",
  "MetricCardTrend",
  "MetricsPanel",
  "PageShell",
  "PageShellProps",
  "Pagination",
  "PaginationProps",
  "PinInput",
  "PinInputProps",
  "PlanBadge",
  "PlanBadgeProps",
  "PlanTier",
  "PreviewEnv",
  "PreviewEnvCard",
  "PreviewService",
  "Progress",
  "ProgressProps",
  "Project",
  "ProjectCard",
  "RadioGroup",
  "RollbackTarget",
  "RollbackUI",
  "ScrollArea",
  "Select",
  "Sheet",
  "Sidebar",
  "Skeleton",
  "SocialAuthRow",
  "SocialProvider",
  "StatTile",
  "StatTileProps",
  "StatusDot",
  "StatusDotProps",
  "StatusIndicator",
  "StatusIndicatorKind",
  "StatusIndicatorProps",
  "StatusIndicatorSize",
  "StatusKind",
  "StickToBottomMetrics",
  "Switch",
  "Table",
  "TableCellProps",
  "TableHeaderCellProps",
  "TableProps",
  "Tabs",
  "TaskHeader",
  "Textarea",
  "TextareaProps",
  "Timestamp",
  "TimestampProps",
  "Toast",
  "ToastVariant",
  "Toaster",
  "Tooltip",
  "TopNav",
  "UpdateBanner",
  "UpdateBannerProps",
  "UseStickToBottomOptions",
  "UseStickToBottomReturn",
  "avatarVariants",
  "badgeVariants",
  "buttonVariants",
  "cn",
  "computePageRange",
  "isNearBottom",
  "sheetVariants",
  "useStickToBottom",
  "useToast",
]);

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, "utf8");
  src = src.replace(/import\s+\{([^}]+)\}\s+from\s+["']@theokit\/ui["'];/g, (m, names) => {
    const list = names
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const key = (n) =>
      n
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]
        .trim();
    const stay = list.filter((n) => !MOVED.has(key(n)));
    const move = list.filter((n) => MOVED.has(key(n)));
    const out = [];
    if (stay.length) out.push("import { " + stay.join(", ") + ' } from "@theokit/ui";');
    if (move.length) out.push("import { " + move.join(", ") + ' } from "@usetheo/ui";');
    return out.join("\n");
  });
  writeFileSync(file, src);
}
console.log("codemod applied to", process.argv.length - 2, "file(s)");
