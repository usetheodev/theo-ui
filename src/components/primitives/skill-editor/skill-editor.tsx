import { useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { Button } from "../button/button.js";
import { FormField } from "../form-field/form-field.js";
import { Input } from "../input/input.js";
import { Select } from "../select/select.js";
import type { Skill, SkillSource, SkillState } from "../skill-card/skill-card.js";
import { Switch } from "../switch/switch.js";
import { Textarea } from "../textarea/textarea.js";

/**
 * SkillEditor — form for creating or editing a Skill.
 */

type SkillDraft = Omit<Skill, "id"> & {
  id?: string;
  instructions?: string;
};

interface SkillEditorProps extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange"> {
  initial?: Partial<Skill> & { instructions?: string };
  onSave: (draft: SkillDraft) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const SOURCES: Array<{ id: SkillSource; label: string }> = [
  { id: "user", label: "User — defined by you" },
  { id: "project", label: "Project — lives in this workspace" },
  { id: "plugin", label: "Plugin — imported from a package" },
  { id: "builtin", label: "Built-in — shipped with Theo" },
];

export function SkillEditor({
  className,
  initial,
  onSave,
  onCancel,
  onDelete,
  ...formProps
}: SkillEditorProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(
    typeof initial?.description === "string" ? initial.description : "",
  );
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [source, setSource] = useState<SkillSource>(initial?.source ?? "user");
  const [allowedToolsRaw, setAllowedToolsRaw] = useState(initial?.allowedTools?.join(", ") ?? "");
  const [triggersRaw, setTriggersRaw] = useState(initial?.triggers?.join(", ") ?? "");
  const [enabled, setEnabled] = useState<SkillState>(initial?.state ?? "enabled");

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when skill identity changes
  useEffect(() => {
    setName(initial?.name ?? "");
    setDescription(typeof initial?.description === "string" ? initial.description : "");
    setInstructions(initial?.instructions ?? "");
    setSource(initial?.source ?? "user");
    setAllowedToolsRaw(initial?.allowedTools?.join(", ") ?? "");
    setTriggersRaw(initial?.triggers?.join(", ") ?? "");
    setEnabled(initial?.state ?? "enabled");
  }, [initial?.id]);

  const canSave = name.trim().length > 0;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      id: initial?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      source,
      state: enabled,
      allowedTools: allowedToolsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      triggers: triggersRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex h-full flex-col gap-4", className)}
      {...formProps}
    >
      <FormField>
        <FormField.Label>Name</FormField.Label>
        <FormField.Control>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="diff-explainer"
            required
          />
        </FormField.Control>
        <FormField.Hint>Kebab-case identifier the agent uses to invoke this skill.</FormField.Hint>
      </FormField>

      <FormField>
        <FormField.Label>Description</FormField.Label>
        <FormField.Control>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain a diff in plain English."
          />
        </FormField.Control>
      </FormField>

      <FormField className="flex-1">
        <FormField.Label>Instructions</FormField.Label>
        <FormField.Control>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            placeholder="When invoked, read the diff via Read or Grep and produce a concise summary of intent + risk."
            className="min-h-[10rem] flex-1 font-mono text-code-sm"
          />
        </FormField.Control>
        <FormField.Hint>Sub-prompt loaded when the skill is invoked.</FormField.Hint>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField>
          <FormField.Label>Source</FormField.Label>
          <FormField.Control>
            <Select value={source} onValueChange={(v) => setSource(v as SkillSource)}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {SOURCES.map((s) => (
                  <Select.Item key={s.id} value={s.id}>
                    {s.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </FormField.Control>
        </FormField>
        <FormField>
          <FormField.Label>Allowed tools</FormField.Label>
          <FormField.Control>
            <Input
              value={allowedToolsRaw}
              onChange={(e) => setAllowedToolsRaw(e.target.value)}
              placeholder="Read, Grep, Bash"
            />
          </FormField.Control>
        </FormField>
      </div>

      <FormField>
        <FormField.Label>Triggers</FormField.Label>
        <FormField.Control>
          <Input
            value={triggersRaw}
            onChange={(e) => setTriggersRaw(e.target.value)}
            placeholder="explain diff, summarize change"
          />
        </FormField.Control>
        <FormField.Hint>Optional keywords / patterns for auto-discovery.</FormField.Hint>
      </FormField>

      <div className="flex items-center gap-3">
        <Switch
          checked={enabled === "enabled"}
          onCheckedChange={(v) => setEnabled(v ? "enabled" : "disabled")}
          aria-label="Enabled"
        />
        <span className="text-body-sm text-muted-foreground">
          {enabled === "enabled"
            ? "Enabled — available to the agent."
            : "Disabled — kept but hidden from the agent."}
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
            {initial?.id ? "Save changes" : "Create skill"}
          </Button>
        </div>
      </footer>
    </form>
  );
}
