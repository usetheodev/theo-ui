import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToolUIPart, UIMessage } from "../../../types/chat.js";
import { ChatMessage } from "../chat-message/chat-message.js";
import {
  AgentToolRenderer,
  defaultClassifyTool,
  defaultToolRegistry,
  resolveToolRenderer,
} from "./agent-tool-renderer.js";

/* ─── fixtures ───────────────────────────────────────────────────────── */

function toolPart(name: string, output?: unknown): ToolUIPart {
  return {
    type: `tool-${name}`,
    toolCallId: `call-${name}`,
    toolName: name,
    state: output === undefined ? "input-available" : "output-available",
    input: {},
    output,
  };
}

function msgWithTool(name: string, output?: unknown): UIMessage {
  return { id: "m1", role: "assistant", parts: [toolPart(name, output)] };
}

/* ─── T1.1 — classify + resolve (pure) ───────────────────────────────── */

describe("defaultClassifyTool (M5-3)", () => {
  it("classifies diff-shaped tool names", () => {
    expect(defaultClassifyTool(toolPart("git_diff"))).toBe("diff");
    expect(defaultClassifyTool(toolPart("apply_patch"))).toBe("diff");
  });
  it("classifies terminal-shaped tool names", () => {
    expect(defaultClassifyTool(toolPart("shell"))).toBe("terminal");
    expect(defaultClassifyTool(toolPart("run_vitest"))).toBe("terminal");
  });
  it("classifies code / created-files / data-table tool names", () => {
    expect(defaultClassifyTool(toolPart("read_file"))).toBe("code");
    expect(defaultClassifyTool(toolPart("edit_file"))).toBe("created-files");
    expect(defaultClassifyTool(toolPart("list_dir"))).toBe("data-table");
  });
  it("returns undefined for an unmapped tool name", () => {
    expect(defaultClassifyTool(toolPart("totally_unknown_tool"))).toBeUndefined();
  });
});

describe("resolveToolRenderer (M5-3)", () => {
  it("returns a renderer for a classified kind", () => {
    expect(
      resolveToolRenderer(defaultToolRegistry, defaultClassifyTool, toolPart("git_diff")),
    ).toBeTypeOf("function");
  });
  it("returns undefined for an unmapped tool (fallback signal)", () => {
    expect(
      resolveToolRenderer(
        defaultToolRegistry,
        defaultClassifyTool,
        toolPart("totally_unknown_tool"),
      ),
    ).toBeUndefined();
  });
  it("honors a custom classify function", () => {
    const classify = () => "terminal" as const;
    expect(resolveToolRenderer(defaultToolRegistry, classify, toolPart("git_diff"))).toBe(
      defaultToolRegistry.terminal,
    );
  });
  it("honors a shallow-merged registry override", () => {
    const custom = { ...defaultToolRegistry, diff: () => null };
    expect(resolveToolRenderer(custom, defaultClassifyTool, toolPart("git_diff"))).toBe(
      custom.diff,
    );
  });
});

/* ─── T2.1 — default renderers ───────────────────────────────────────── */

describe("defaultToolRegistry renderers (M5-3)", () => {
  it("code renderer renders the stringified output", () => {
    render(<div>{defaultToolRegistry.code(toolPart("read_file", "const x = 1"))}</div>);
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
  });
  it("terminal renderer renders stdout lines", () => {
    render(<div>{defaultToolRegistry.terminal(toolPart("shell", "hello\nworld"))}</div>);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
  });
  it("diff renderer degrades to ToolCallPart on unstructured output (no throw)", () => {
    const { container } = render(
      <div>{defaultToolRegistry.diff(toolPart("git_diff", "not a diff"))}</div>,
    );
    expect(container.querySelector('[data-slot="tool-call-part"]')).toBeInTheDocument();
  });
  it("diff renderer renders DiffViewer on structured {path,hunks} output", () => {
    render(
      <div>{defaultToolRegistry.diff(toolPart("git_diff", { path: "a.ts", hunks: [] }))}</div>,
    );
    expect(screen.getByText("a.ts")).toBeInTheDocument();
  });
  it("created-files renderer does not throw on unknown output", () => {
    expect(() =>
      render(<div>{defaultToolRegistry["created-files"](toolPart("edit_file", 42))}</div>),
    ).not.toThrow();
  });
  it("data-table renderer does not throw on unknown output", () => {
    expect(() =>
      render(<div>{defaultToolRegistry["data-table"](toolPart("list_dir", null))}</div>),
    ).not.toThrow();
  });
});

/* ─── T3.1 — ChatMessage wiring ──────────────────────────────────────── */

describe("ChatMessage tool dispatch (M5-3)", () => {
  it("renders DiffViewer for a structured git_diff tool via the default registry", () => {
    render(<ChatMessage message={msgWithTool("git_diff", { path: "a.ts", hunks: [] })} />);
    expect(screen.getByText("a.ts")).toBeInTheDocument();
  });
  it("falls back to ToolCallPart for an unmapped tool", () => {
    const { container } = render(<ChatMessage message={msgWithTool("totally_unknown", "x")} />);
    expect(container.querySelector('[data-slot="tool-call-part"]')).toBeInTheDocument();
  });
  it("a custom toolRenderers override wins over the default", () => {
    render(
      <ChatMessage
        message={msgWithTool("git_diff", {})}
        toolRenderers={{ ...defaultToolRegistry, diff: () => <span>CUSTOM</span> }}
      />,
    );
    expect(screen.getByText("CUSTOM")).toBeInTheDocument();
  });
  it("partRenderers.tool still wins over the registry", () => {
    render(
      <ChatMessage
        message={msgWithTool("git_diff", {})}
        partRenderers={{ tool: () => <span>ALLTOOLS</span> }}
      />,
    );
    expect(screen.getByText("ALLTOOLS")).toBeInTheDocument();
  });
});

/* ─── AgentToolRenderer component ────────────────────────────────────── */

describe("AgentToolRenderer component (M5-3)", () => {
  it("renders the resolved renderer for a mapped tool", () => {
    render(<AgentToolRenderer part={toolPart("read_file", "abc")} />);
    expect(screen.getByText(/abc/)).toBeInTheDocument();
  });
  it("falls back to ToolCallPart for an unmapped tool", () => {
    const { container } = render(<AgentToolRenderer part={toolPart("nope", "x")} />);
    expect(container.querySelector('[data-slot="tool-call-part"]')).toBeInTheDocument();
  });
});

/* ─── T4.1 — barrel wiring ───────────────────────────────────────────── */

describe("@theokit/ui/agent-tool-renderer subpath (M5-3 wiring)", () => {
  it("exposes the registry + classify + resolve + component through the public subpath barrel", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.AgentToolRenderer).toBe("function");
    expect(typeof mod.defaultClassifyTool).toBe("function");
    expect(typeof mod.resolveToolRenderer).toBe("function");
    expect(mod.defaultToolRegistry).toBeTypeOf("object");
  });
});
