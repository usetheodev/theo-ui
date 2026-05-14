import { useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { ALL_MODES, MODE_LABEL, type Mode } from "../../../types/mode.js";
import type { Rule, RuleScope, RuleState } from "../../../types/rule.js";
import { Button } from "../button/button.js";
import { FormField } from "../form-field/form-field.js";
import { Input } from "../input/input.js";
import { Select } from "../select/select.js";
import { Switch } from "../switch/switch.js";
import { Textarea } from "../textarea/textarea.js";

/**
 * RuleEditor — form for creating or editing a Rule (behavior instruction
 * injected into the system prompt).
 */

type RuleDraft = Omit<Rule, "id" | "updatedAt"> & {
  id?: string;
  tags?: string[];
};

interface RuleEditorProps extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange"> {
  initial?: Partial<Rule>;
  onSave: (draft: RuleDraft) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const SCOPES: Array<{ id: RuleScope; label: string }> = [
  { id: "global", label: "Global — applies to every session" },
  { id: "project", label: "Project — only this workspace" },
];

export function RuleEditor({
  className,
  initial,
  onSave,
  onCancel,
  onDelete,
  ...formProps
}: RuleEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [scope, setScope] = useState<RuleScope>(initial?.scope ?? "global");
  const [tagsRaw, setTagsRaw] = useState(initial?.tags?.join(", ") ?? "");
  const [enabled, setEnabled] = useState<RuleState>(initial?.state ?? "enabled");
  const [modes, setModes] = useState<Mode[]>(initial?.modes ?? []);

  // Note: state is only seeded once on mount. To reset the form when editing
  // a different rule, use the React `key` pattern at the call site:
  //   <RuleEditor key={rule.id} initial={rule} ... />
  const toggleMode = (m: Mode) =>
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const canSave = title.trim().length > 0 && body.trim().length > 0;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      id: initial?.id,
      title: title.trim(),
      body: body.trim(),
      scope,
      state: enabled,
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      modes: modes.length > 0 ? modes : undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex h-full flex-col gap-4", className)}
      {...formProps}
    >
      <FormField>
        <FormField.Label>Title</FormField.Label>
        <FormField.Control>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Always write tests before fixes"
            required
          />
        </FormField.Control>
        <FormField.Hint>Short, imperative summary the agent will keep in memory.</FormField.Hint>
      </FormField>

      <FormField className="flex-1">
        <FormField.Label>Body (markdown)</FormField.Label>
        <FormField.Control>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="When fixing a bug, first write a failing regression test, then the fix."
            required
            className="min-h-[12rem] flex-1 font-mono text-code-sm"
          />
        </FormField.Control>
        <FormField.Hint>Injected into the system prompt verbatim.</FormField.Hint>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField>
          <FormField.Label>Scope</FormField.Label>
          <FormField.Control>
            <Select value={scope} onValueChange={(v) => setScope(v as RuleScope)}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {SCOPES.map((s) => (
                  <Select.Item key={s.id} value={s.id}>
                    {s.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </FormField.Control>
        </FormField>
        <FormField>
          <FormField.Label>Tags (comma-separated)</FormField.Label>
          <FormField.Control>
            <Input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="testing, process"
            />
          </FormField.Control>
        </FormField>
      </div>

      <FormField>
        <FormField.Label>Active modes</FormField.Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_MODES.map((m) => {
            const on = modes.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMode(m)}
                aria-pressed={on}
                className={cn(
                  "inline-flex h-7 items-center rounded-full border px-3 font-mono text-body-sm transition-colors",
                  on
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {MODE_LABEL[m]}
              </button>
            );
          })}
        </div>
        <FormField.Hint>
          {modes.length === 0
            ? "Empty = global (applies to every mode)."
            : `Only visible in: ${modes.map((m) => MODE_LABEL[m]).join(", ")}.`}
        </FormField.Hint>
      </FormField>

      <div className="flex items-center gap-3">
        <Switch
          checked={enabled === "enabled"}
          onCheckedChange={(v) => setEnabled(v ? "enabled" : "disabled")}
          aria-label="Enabled"
        />
        <span className="text-body-sm text-muted-foreground">
          {enabled === "enabled"
            ? "Enabled — agent will follow this rule."
            : "Disabled — kept but ignored."}
        </span>
      </div>

      <footer className="flex items-center justify-between gap-2 border-border/40 border-t pt-4">
        <div>
          {onDelete ? (
            <Button type="button" variant="ghost" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={!canSave}>
            {initial?.id ? "Save changes" : "Create rule"}
          </Button>
        </div>
      </footer>
    </form>
  );
}
