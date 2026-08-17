import { describe, expect, it } from "vitest";
import {
  type CompositeAdjacency,
  type LayerMembership,
  collectCompositeEdges,
  findCompositeCycles,
  findPrimitiveOffenses,
  importsScreen,
  parseImportsDetailed,
  resolveSpecifierToLayer,
} from "./import-graph.js";

const layers: LayerMembership = {
  primitives: new Set([
    "button",
    "form-field",
    "label",
    "input",
    "select",
    "switch",
    "textarea",
    "approval-card",
    "agent-editor",
    "agent-profile",
    "rule-editor",
    "skill-editor",
    "skill-card",
    "toast",
  ]),
  composites: new Set(["agent-stream", "permission-modal"]),
};

const fromAgentEditor = "/repo/src/components/primitives/agent-editor/agent-editor.tsx";
const fromAgentStream = "/repo/src/components/composites/agent-stream/agent-stream.tsx";

describe("parseImportsDetailed", () => {
  it("extracts a single-line value import", () => {
    const imports = parseImportsDetailed(`import { Button } from "../button/button.js";\n`);
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({ specifier: "../button/button.js", isType: false });
  });

  it("flags `import type` as type-only", () => {
    const imports = parseImportsDetailed(
      `import type { Skill } from "../skill-card/skill-card.js";\n`,
    );
    expect(imports).toHaveLength(1);
    expect(imports[0]?.isType).toBe(true);
  });

  it("captures multiple imports in one file", () => {
    const content = [
      `import { Button } from "../button/button.js";`,
      `import type { Skill } from "../skill-card/skill-card.js";`,
      `import { Input } from "../input/input.js";`,
    ].join("\n");
    const imports = parseImportsDetailed(content);
    expect(imports).toHaveLength(3);
  });

  it("captures multi-line import (names body spans newlines)", () => {
    const content = [
      "import {",
      "  type MCPServer,",
      "  MCPServerCard,",
      "  type MCPServerStatus,",
      `} from "../mcp-server-card/mcp-server-card.js";`,
    ].join("\n");
    const imports = parseImportsDetailed(content);
    expect(imports).toHaveLength(1);
    expect(imports[0]?.specifier).toBe("../mcp-server-card/mcp-server-card.js");
  });
});

describe("resolveSpecifierToLayer", () => {
  it("resolves a sibling primitive import to its layer/name", () => {
    const out = resolveSpecifierToLayer(fromAgentEditor, "../button/button.js", layers);
    expect(out.layer).toBe("primitives");
    expect(out.name).toBe("button");
  });

  it("returns null for non-relative specifiers", () => {
    const out = resolveSpecifierToLayer(fromAgentEditor, "react", layers);
    expect(out.layer).toBeNull();
    expect(out.name).toBeNull();
  });

  it("returns null when the resolved path is outside components/", () => {
    const out = resolveSpecifierToLayer(fromAgentEditor, "../../../lib/cn.js", layers);
    expect(out.layer).toBeNull();
    expect(out.name).toBeNull();
  });

  it("resolves cross-layer composite → primitive via barrel", () => {
    const out = resolveSpecifierToLayer(
      fromAgentStream,
      "../../primitives/button/index.js",
      layers,
    );
    expect(out.layer).toBe("primitives");
    expect(out.name).toBe("button");
  });
});

describe("findPrimitiveOffenses (the gate behavior)", () => {
  it("flags a sibling-primitive value import (the BLOCKER-001 case)", () => {
    const content = `import { Button } from "../button/button.js";`;
    const offenses = findPrimitiveOffenses(fromAgentEditor, "agent-editor", content, layers);
    expect(offenses).toHaveLength(1);
    expect(offenses[0]?.targetName).toBe("button");
  });

  it("ALLOWS a sibling type-only import (architecture exception)", () => {
    const content = `import type { Skill } from "../skill-card/skill-card.js";`;
    const offenses = findPrimitiveOffenses(
      "/repo/src/components/primitives/skill-editor/skill-editor.tsx",
      "skill-editor",
      content,
      layers,
    );
    expect(offenses).toHaveLength(0);
  });

  it("does NOT flag imports of cn / themes / types / lib", () => {
    const content = [
      `import { cn } from "../../../lib/cn.js";`,
      `import type { ReactNode } from "react";`,
      `import { violetForge } from "../../../themes/index.js";`,
    ].join("\n");
    const offenses = findPrimitiveOffenses(fromAgentEditor, "agent-editor", content, layers);
    expect(offenses).toHaveLength(0);
  });

  it("flags 5 separate sibling-primitive imports in agent-editor reality", () => {
    const content = [
      `import { Button } from "../button/button.js";`,
      `import { FormField } from "../form-field/form-field.js";`,
      `import { Input } from "../input/input.js";`,
      `import { Select } from "../select/select.js";`,
      `import { Textarea } from "../textarea/textarea.js";`,
    ].join("\n");
    const offenses = findPrimitiveOffenses(fromAgentEditor, "agent-editor", content, layers);
    expect(offenses).toHaveLength(5);
    expect(offenses.map((o) => o.targetName).sort()).toEqual([
      "button",
      "form-field",
      "input",
      "select",
      "textarea",
    ]);
  });

  it("allowlists Toaster (global provider primitive) per D7", () => {
    // Hypothetical reverse: a primitive importing `toast` (the Toaster
    // provider). Not real today, but the allowlist must be honored.
    const content = `import { Toast } from "../toast/toast.js";`;
    const offenses = findPrimitiveOffenses(
      "/repo/src/components/primitives/some-primitive/some-primitive.tsx",
      "some-primitive",
      content,
      layers,
    );
    expect(offenses).toHaveLength(0);
  });
});

describe("importsScreen (composite guard)", () => {
  it("flags composite importing from src/screens/", () => {
    const content = `import { TheoCodeShell } from "../../../screens/theo-code-shell.js";`;
    expect(importsScreen(fromAgentStream, content)).toBe(true);
  });

  it("does not flag normal composite imports", () => {
    const content = `import { Button } from "../../primitives/button/index.js";`;
    expect(importsScreen(fromAgentStream, content)).toBe(false);
  });
});

describe("composite cycle detection (NEW-C)", () => {
  const compositeLayers: LayerMembership = {
    primitives: new Set(["button"]),
    composites: new Set(["a", "b", "c", "d"]),
  };

  function fileFor(name: string): string {
    return `/repo/src/components/composites/${name}/${name}.tsx`;
  }

  it("returns no cycles for an acyclic graph", () => {
    const adj: CompositeAdjacency = new Map();
    collectCompositeEdges(
      fileFor("a"),
      "a",
      `import { B } from "../b/index.js";`,
      compositeLayers,
      adj,
    );
    collectCompositeEdges(
      fileFor("b"),
      "b",
      `import { C } from "../c/index.js";`,
      compositeLayers,
      adj,
    );
    collectCompositeEdges(fileFor("c"), "c", "", compositeLayers, adj);
    expect(findCompositeCycles(adj)).toEqual([]);
  });

  it("detects a 2-node cycle a → b → a", () => {
    const adj: CompositeAdjacency = new Map();
    collectCompositeEdges(
      fileFor("a"),
      "a",
      `import { B } from "../b/index.js";`,
      compositeLayers,
      adj,
    );
    collectCompositeEdges(
      fileFor("b"),
      "b",
      `import { A } from "../a/index.js";`,
      compositeLayers,
      adj,
    );
    const cycles = findCompositeCycles(adj);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(["a", "b", "a"]);
  });

  it("detects a 3-node cycle a → b → c → a", () => {
    const adj: CompositeAdjacency = new Map();
    collectCompositeEdges(
      fileFor("a"),
      "a",
      `import { B } from "../b/index.js";`,
      compositeLayers,
      adj,
    );
    collectCompositeEdges(
      fileFor("b"),
      "b",
      `import { C } from "../c/index.js";`,
      compositeLayers,
      adj,
    );
    collectCompositeEdges(
      fileFor("c"),
      "c",
      `import { A } from "../a/index.js";`,
      compositeLayers,
      adj,
    );
    const cycles = findCompositeCycles(adj);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(["a", "b", "c", "a"]);
  });

  it("ignores type-only composite imports", () => {
    const adj: CompositeAdjacency = new Map();
    collectCompositeEdges(
      fileFor("a"),
      "a",
      `import type { BProps } from "../b/index.js";`,
      compositeLayers,
      adj,
    );
    collectCompositeEdges(
      fileFor("b"),
      "b",
      `import { A } from "../a/index.js";`,
      compositeLayers,
      adj,
    );
    // Only b → a edge exists; not a cycle.
    expect(findCompositeCycles(adj)).toEqual([]);
  });

  it("ignores composite imports of primitives", () => {
    const adj: CompositeAdjacency = new Map();
    collectCompositeEdges(
      fileFor("a"),
      "a",
      `import { Button } from "../../primitives/button/index.js";`,
      compositeLayers,
      adj,
    );
    expect(findCompositeCycles(adj)).toEqual([]);
  });
});
