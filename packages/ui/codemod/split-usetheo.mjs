#!/usr/bin/env node
/**
 * Codemod: rewrite imports of moved components from `@theokit/ui` to `@usetheo/ui`.
 * Pivot v1 (AI-exclusive split). Usage: node split-usetheo.mjs <file...>
 *
 * What it matches, and why each part is there (usetheokit/theokit-ui#41):
 *
 *   - The trailing `;` is OPTIONAL. It used to be required, so in a project formatted with
 *     Prettier `semi: false` the codemod matched nothing and still reported success. Run
 *     over 192 such files it printed "codemod applied to 192 file(s)" and changed none.
 *   - `import type { … }` is matched too. MOVED carries as many type names as value names
 *     (ButtonProps, AlertIntent, DataTableColumn, …) and `import\s+\{` never saw them, so
 *     a type-only import of a moved symbol was left pointing at the wrong package.
 *   - The quote character and the presence of the semicolon are CAPTURED and reused, so the
 *     rewritten line matches the file it lives in instead of forcing this project's style
 *     onto the caller's.
 *
 * Honest limits: this is a regular expression, not a parser. It will rewrite a matching
 * import that appears inside a comment or a template literal, and it does not understand
 * `import * as`, default imports, or `export … from`. None of those forms carry the moved
 * symbols in the codebases this migration targets, and a one-shot migration script does not
 * earn a parser dependency — but run it on a clean tree and read the diff.
 */
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

const files = process.argv.slice(2);
const changed = [];

for (const file of files) {
  const before = readFileSync(file, "utf8");

  //   1: `type ` when present   2: the names   3: the quote char   4: the `;` when present
  const after = before.replace(
    /import\s+(type\s+)?\{([^}]*)\}\s*from\s*(["'])@theokit\/ui\3(;?)/g,
    (_match, typePrefix, names, quote, semi) => {
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
      const head = `import ${typePrefix ?? ""}`;
      const out = [];
      if (stay.length)
        out.push(`${head}{ ${stay.join(", ")} } from ${quote}@theokit/ui${quote}${semi}`);
      if (move.length)
        out.push(`${head}{ ${move.join(", ")} } from ${quote}@usetheo/ui${quote}${semi}`);
      return out.join("\n");
    },
  );

  // Only write what actually changed. Rewriting every file churns mtime on untouched
  // sources and invalidates build caches for nothing.
  if (after !== before) {
    writeFileSync(file, after);
    changed.push(file);
  }
}

// Report what was CHANGED, against what was inspected. The old count was
// `process.argv.length - 2` — the number of paths passed — so a run that migrated nothing
// was indistinguishable from a run that migrated everything.
console.log(`codemod changed ${changed.length} of ${files.length} file(s) inspected`);
for (const file of changed) console.log(`  ${file}`);

if (files.length > 0 && changed.length === 0) {
  console.log(
    "\nNothing matched. If you expected changes, check that the imports name `@theokit/ui` " +
      "and that the symbols are in this codemod's MOVED set.",
  );
}
