"use client";

import { Button } from "@usetheo/ui";
import { FormField } from "@usetheo/ui";
import { Input } from "@usetheo/ui";
import { Select } from "@usetheo/ui";
import { Textarea } from "@usetheo/ui";
import { useState } from "react";
import type { FormEvent, HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { ALL_MODES, MODE_LABEL, type Mode } from "../../../types/mode.js";
import type { AgentProfileDescriptor } from "../../primitives/agent-profile/index.js";

/**
 * AgentEditor — form for creating or editing an Agent persona.
 */

export interface AgentDraft extends Omit<AgentProfileDescriptor, "id"> {
  id?: string;
  systemPrompt?: string;
  model?: string;
  allowedTools?: string[];
  skillIds?: string[];
  /** Modes this agent is visible in. Omit / empty = global (all modes). */
  modes?: Mode[];
}

interface AgentEditorProps extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange"> {
  initial?: Partial<AgentDraft>;
  models?: Array<{ id: string; label: string }>;
  skills?: Array<{ id: string; label: string }>;
  onSave: (draft: AgentDraft) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const TONES: Array<{ id: NonNullable<AgentProfileDescriptor["tone"]>; label: string }> = [
  { id: "primary", label: "Primary (violet)" },
  { id: "accent", label: "Accent (sienna)" },
  { id: "success", label: "Success (green)" },
  { id: "warning", label: "Warning (amber)" },
  { id: "info", label: "Info (blue)" },
  { id: "muted", label: "Muted (neutral)" },
];

export function AgentEditor({
  className,
  initial,
  models,
  skills,
  onSave,
  onCancel,
  onDelete,
  ...formProps
}: AgentEditorProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [initials, setInitials] = useState(initial?.initials ?? "");
  const [description, setDescription] = useState(
    typeof initial?.description === "string" ? initial.description : "",
  );
  const [tone, setTone] = useState<NonNullable<AgentProfileDescriptor["tone"]>>(
    initial?.tone ?? "primary",
  );
  const [model, setModel] = useState<string>(initial?.model ?? models?.[0]?.id ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [allowedToolsRaw, setAllowedToolsRaw] = useState(initial?.allowedTools?.join(", ") ?? "");
  const [skillsSelected, setSkillsSelected] = useState<Set<string>>(
    new Set(initial?.skillIds ?? []),
  );
  const [modes, setModes] = useState<Mode[]>(initial?.modes ?? []);

  // Note: state is only seeded once on mount. To reset the form when editing a
  // different agent, use the React `key` pattern at the call site:
  //   <AgentEditor key={agent.id} initial={agent} ... />
  // This is the idiomatic React way (over a useEffect that watches prop deltas
  // and writes setters) — it guarantees a clean component instance per entity.
  const toggleMode = (m: Mode) =>
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const canSave = name.trim().length > 0;
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      id: initial?.id,
      name: name.trim(),
      initials: initials.trim() || undefined,
      description: description.trim() || undefined,
      tone,
      model: model || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      allowedTools: allowedToolsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      skillIds: Array.from(skillsSelected),
      modes: modes.length > 0 ? modes : undefined,
    });
  };

  const toggleSkill = (id: string) => {
    setSkillsSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form
      data-slot="agent-editor"
      onSubmit={handleSubmit}
      className={cn("flex h-full flex-col gap-4", className)}
      {...formProps}
    >
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <FormField>
          <FormField.Label>Name</FormField.Label>
          <FormField.Control>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coder"
              required
            />
          </FormField.Control>
        </FormField>
        <FormField className="w-24">
          <FormField.Label>Initials</FormField.Label>
          <FormField.Control>
            <Input
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 2).toUpperCase())}
              placeholder="CO"
              maxLength={2}
              className="text-center font-mono uppercase"
            />
          </FormField.Control>
        </FormField>
      </div>

      <FormField>
        <FormField.Label>Description</FormField.Label>
        <FormField.Control>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Writes code, edits files, runs verification."
          />
        </FormField.Control>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField>
          <FormField.Label>Tone</FormField.Label>
          <FormField.Control>
            <Select
              value={tone}
              onValueChange={(v) => {
                // Re-audit Issue 7: narrow the string `v` against TONES.id
                // values before casting. Radix Select guarantees `v` is one
                // of the Select.Item values declared below, but adding the
                // runtime guard keeps the type narrowing explicit and
                // surfaces invalid future configurations as no-ops instead
                // of silently writing a bad state.
                const next = TONES.find((t) => t.id === v);
                if (next) setTone(next.id);
              }}
            >
              <Select.Trigger aria-label="Select tone">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {TONES.map((t) => (
                  <Select.Item key={t.id} value={t.id}>
                    {t.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </FormField.Control>
        </FormField>
        {models && models.length > 0 ? (
          <FormField>
            <FormField.Label>Model</FormField.Label>
            <FormField.Control>
              <Select value={model} onValueChange={setModel}>
                <Select.Trigger aria-label="Select model">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {models.map((m) => (
                    <Select.Item key={m.id} value={m.id}>
                      {m.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </FormField.Control>
          </FormField>
        ) : null}
      </div>

      <FormField className="flex-1">
        <FormField.Label>System prompt override</FormField.Label>
        <FormField.Control>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            placeholder="You are the Coder. You write code, edit files, and run verification…"
            className="min-h-[10rem] flex-1 font-mono text-code-sm"
          />
        </FormField.Control>
        <FormField.Hint>Leave empty to inherit the workspace default.</FormField.Hint>
      </FormField>

      <FormField>
        <FormField.Label>Allowed tools</FormField.Label>
        <FormField.Control>
          <Input
            value={allowedToolsRaw}
            onChange={(e) => setAllowedToolsRaw(e.target.value)}
            placeholder="Read, Edit, Bash"
          />
        </FormField.Control>
      </FormField>

      {skills && skills.length > 0 ? (
        <FormField>
          <FormField.Label>Linked skills</FormField.Label>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => {
              const on = skillsSelected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.id)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex h-7 items-center rounded-full border px-3 font-mono text-body-sm transition-colors",
                    on
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </FormField>
      ) : null}

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
            ? "Empty = global (available in every mode)."
            : `Only visible in: ${modes.map((m) => MODE_LABEL[m]).join(", ")}.`}
        </FormField.Hint>
      </FormField>

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
            {initial?.id ? "Save changes" : "Create agent"}
          </Button>
        </div>
      </footer>
    </form>
  );
}
