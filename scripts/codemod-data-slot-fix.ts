/**
 * Corrective codemod (review fixes F-dom-1 / F-arch-1 / F-arch-2):
 *
 *   1. NAMING — the original `codemod-data-slot.ts` derived the slot from the
 *      local const name (`Header`, `Root`), producing `data-slot="header"` /
 *      `"root"`. shadcn v4 names slots after the component's PUBLIC identity
 *      (its `displayName`): `Card.Header` → `card-header`, `Card` → `card`.
 *      This pass rewrites every `data-slot` value to `kebab(displayName)` with
 *      dots → dashes, read from the `<Const>.displayName = "..."` statements.
 *
 *   2. ORDERING — shadcn places `data-slot` / `data-variant` / `data-size` as
 *      the FIRST attributes, before `className` and `{...props}`, so a consumer
 *      spreading props cannot accidentally shadow them. The original codemod
 *      appended them last. This pass moves them to the front.
 *
 * Idempotent. Run via: npx tsx scripts/codemod-data-slot-fix.ts [--dry]
 */
import { Node, Project, SyntaxKind } from "ts-morph";

const DRY = process.argv.includes("--dry");
const SLOT_ATTRS = ["data-slot", "data-variant", "data-size"];

type Opening = import("ts-morph").JsxOpeningElement | import("ts-morph").JsxSelfClosingElement;

function kebab(name: string): string {
  return name
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function jsxAttributes(opening: Opening) {
  return opening.getAttributes().filter(Node.isJsxAttribute);
}

/** Nearest enclosing component const/function name. */
function enclosingComponentName(node: Node): string | null {
  let cur: Node | undefined = node;
  while (cur) {
    if (Node.isVariableDeclaration(cur)) {
      const n = cur.getName();
      if (/^[A-Z]/.test(n)) return n;
    }
    if (Node.isFunctionDeclaration(cur)) {
      const n = cur.getName();
      if (n && /^[A-Z]/.test(n)) return n;
    }
    cur = cur.getParent();
  }
  return null;
}

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const files = project
  .getSourceFiles(["src/components/primitives/**/*.tsx", "src/components/composites/**/*.tsx"])
  .filter((f) => !f.getFilePath().match(/\.(test|stories)\.tsx$/))
  .filter((f) => f.getText().includes("data-slot="));

let renamed = 0;
let reordered = 0;
let filesTouched = 0;

for (const sf of files) {
  let touched = false;

  // Map const name → displayName string (e.g. Header → "Card.Header").
  const displayNames = new Map<string, string>();
  for (const stmt of sf.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
    const left = stmt.getLeft().getText();
    const m = left.match(/^([A-Za-z0-9_]+)\.displayName$/);
    if (!m) continue;
    const right = stmt.getRight();
    if (Node.isStringLiteral(right)) displayNames.set(m[1] as string, right.getLiteralValue());
  }

  const openings: Opening[] = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const opening of openings) {
    const attrs = jsxAttributes(opening);
    const slotAttr = attrs.find((a) => a.getNameNode().getText() === "data-slot");
    if (!slotAttr) continue;

    // 1. Fix the slot value from the enclosing component's displayName.
    const compName = enclosingComponentName(opening);
    if (compName) {
      const display = displayNames.get(compName) ?? compName;
      const correct = kebab(display);
      const init = slotAttr.getInitializer();
      const current = init && Node.isStringLiteral(init) ? init.getLiteralValue() : null;
      if (current !== null && current !== correct) {
        if (Node.isStringLiteral(init)) {
          init.setLiteralValue(correct);
          renamed++;
          touched = true;
        }
      }
    }

    // 2. Reorder: data-slot/variant/size move to the front (before className/{...props}).
    //    ts-morph has no "move attribute"; capture their text, remove, re-insert at 0.
    const present = SLOT_ATTRS.map((name) => {
      const a = jsxAttributes(opening).find((x) => x.getNameNode().getText() === name);
      return a ? { name, text: a.getText(), node: a } : null;
    }).filter(
      (x): x is { name: string; text: string; node: import("ts-morph").JsxAttribute } => x !== null,
    );

    const firstAttrs = jsxAttributes(opening)
      .slice(0, present.length)
      .map((a) => a.getNameNode().getText());
    const alreadyFront = SLOT_ATTRS.slice(0, present.length).every((n, i) => firstAttrs[i] === n);
    if (present.length > 0 && !alreadyFront) {
      // Remove existing (back-to-front to keep indices valid).
      for (const p of [...present].reverse()) p.node.remove();
      // Re-insert at front in canonical order.
      let idx = 0;
      for (const name of SLOT_ATTRS) {
        const found = present.find((p) => p.name === name);
        if (!found) continue;
        const eq = found.text.indexOf("=");
        if (eq === -1) {
          opening.insertAttribute(idx, { name });
        } else {
          const initializer = found.text.slice(eq + 1);
          opening.insertAttribute(idx, { name, initializer });
        }
        idx++;
      }
      reordered++;
      touched = true;
    }
  }

  if (touched) {
    filesTouched++;
    if (!DRY) sf.saveSync();
  }
}

console.log(
  `codemod-data-slot-fix: ${renamed} slot value(s) corrected + ${reordered} element(s) reordered across ${filesTouched} file(s)${DRY ? " (dry-run)" : ""}.`,
);
