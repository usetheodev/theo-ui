/**
 * Codemod: add `data-variant` / `data-size` to cva-driven component roots
 * (shadcn v4 convention — Button emits `data-slot` + `data-variant` + `data-size`).
 *
 * For every component file that imports `cva`, find the root element already
 * carrying `data-slot` and, when the enclosing component destructures a
 * `variant` and/or `size` prop, add `data-variant={variant}` / `data-size={size}`.
 * The `*Variants` const is already exported by these components, so consumers
 * can both target by attribute and reuse the variant classes.
 *
 * Idempotent. Run via: npx tsx scripts/codemod-data-variant.ts [--dry]
 */
import { Node, Project, SyntaxKind } from "ts-morph";

const DRY = process.argv.includes("--dry");

type Opening = import("ts-morph").JsxOpeningElement | import("ts-morph").JsxSelfClosingElement;

function jsxAttributes(opening: Opening) {
  return opening.getAttributes().filter(Node.isJsxAttribute);
}

function hasAttr(opening: Opening, attr: string): boolean {
  return jsxAttributes(opening).some((a) => a.getNameNode().getText() === attr);
}

/** Names of identifiers destructured in the enclosing component's params. */
function enclosingDestructuredParams(node: Node): Set<string> {
  const names = new Set<string>();
  const fn = node.getFirstAncestor(
    (a) => Node.isArrowFunction(a) || Node.isFunctionDeclaration(a) || Node.isFunctionExpression(a),
  );
  if (!fn || !Node.isArrowFunction(fn)) {
    // forwardRef render fns are arrow functions; covers the cva components.
  }
  const target = fn ?? node;
  for (const param of (target as { getParameters?: () => unknown[] }).getParameters?.() ?? []) {
    const p = param as Node;
    const binding = p.getFirstChildByKind(SyntaxKind.ObjectBindingPattern);
    if (!binding) continue;
    for (const el of binding.getChildrenOfKind(SyntaxKind.BindingElement)) {
      names.add(el.getName());
    }
  }
  return names;
}

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const files = project
  .getSourceFiles(["src/components/primitives/**/*.tsx", "src/components/composites/**/*.tsx"])
  .filter((f) => !f.getFilePath().match(/\.(test|stories)\.tsx$/))
  .filter((f) => /\bcva\s*\(/.test(f.getText()));

let marked = 0;
let filesTouched = 0;

for (const sf of files) {
  let touched = false;
  const openings: Opening[] = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];
  for (const opening of openings) {
    if (!hasAttr(opening, "data-slot")) continue;
    const params = enclosingDestructuredParams(opening);
    if (params.has("variant") && !hasAttr(opening, "data-variant")) {
      opening.addAttribute({ name: "data-variant", initializer: "{variant}" });
      marked++;
      touched = true;
    }
    if (params.has("size") && !hasAttr(opening, "data-size")) {
      opening.addAttribute({ name: "data-size", initializer: "{size}" });
      marked++;
      touched = true;
    }
  }
  if (touched) {
    filesTouched++;
    if (!DRY) sf.saveSync();
  }
}

console.log(
  `codemod-data-variant: ${marked} attribute(s) added across ${filesTouched} file(s)${DRY ? " (dry-run)" : ""}.`,
);
