/**
 * Codemod: add `data-slot` to every component root element (shadcn v4 convention).
 *
 * Strategy (reliable signal, no guessing the "outermost" element): a component's
 * root JSX element is the one that forwards the ref — `ref={ref}`. We add
 * `data-slot="<kebab-component-name>"` to that element, naming it after the
 * enclosing `const <Name> = forwardRef(...)` / `function <Name>(...)`. This
 * mirrors shadcn's `data-slot="card"` / `data-slot="card-header"` per-part
 * naming (root component = name; compound sub-parts = their own component name
 * kebab-cased, e.g. CardHeader → card-header).
 *
 * A small set of function/Slot-root components without a forwarded ref are
 * handled by a fallback pass that marks the root element of the exported
 * component's top-level return.
 *
 * Idempotent: skips elements that already declare data-slot. Run via:
 *   npx tsx scripts/codemod-data-slot.ts [--dry]
 */
import { Node, Project, SyntaxKind } from "ts-morph";

const DRY = process.argv.includes("--dry");

function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** Walk up to the nearest named component (VariableDeclaration / FunctionDeclaration). */
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

type Opening = import("ts-morph").JsxOpeningElement | import("ts-morph").JsxSelfClosingElement;

function jsxAttributes(opening: Opening) {
  return opening.getAttributes().filter(Node.isJsxAttribute);
}

function hasAttr(opening: Opening, attr: string): boolean {
  return jsxAttributes(opening).some((a) => a.getNameNode().getText() === attr);
}

/** Does this opening element forward the ref (`ref={ref}` or `ref={ref as ...}`)? */
function forwardsRef(opening: Opening): boolean {
  return jsxAttributes(opening).some((a) => {
    if (a.getNameNode().getText() !== "ref") return false;
    const init = a.getInitializer();
    if (!init) return false;
    const inner = init
      .getText()
      .replace(/^\{|\}$/g, "")
      .trim();
    // `ref`  OR  `ref as React.Ref<...>`  OR  `ref as never`
    return /^ref\b/.test(inner);
  });
}

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const files = project
  .getSourceFiles(["src/components/primitives/**/*.tsx", "src/components/composites/**/*.tsx"])
  .filter((f) => !f.getFilePath().match(/\.(test|stories)\.tsx$/));

let elementsMarked = 0;
let filesTouched = 0;

for (const sf of files) {
  let touched = false;

  const openings = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const opening of openings) {
    if (!forwardsRef(opening)) continue;
    if (hasAttr(opening, "data-slot")) continue;
    const compName = enclosingComponentName(opening);
    if (!compName) continue;
    const slot = kebab(compName);
    opening.addAttribute({ name: "data-slot", initializer: `"${slot}"` });
    elementsMarked++;
    touched = true;
  }

  // Fallback pass — function/arrow components WITHOUT a forwarded ref (e.g.
  // composites whose root is a primitive, or React-19-style function comps).
  // Mark the root element of each exported component's top-level return.
  if (!touched && !sf.getText().includes("data-slot=")) {
    const comps: { name: string; body: Node }[] = [];
    for (const fn of sf.getFunctions()) {
      const n = fn.getName();
      if (n && /^[A-Z]/.test(n) && fn.getBody())
        comps.push({ name: n, body: fn.getBody() as Node });
    }
    for (const vd of sf.getVariableDeclarations()) {
      const n = vd.getName();
      if (!/^[A-Z]/.test(n)) continue;
      const init = vd.getInitializer();
      if (init && Node.isArrowFunction(init) && init.getBody()) {
        comps.push({ name: n, body: init.getBody() as Node });
      }
    }
    for (const { name, body } of comps) {
      // Top-level return inside THIS component body (skip nested fns like map cbs).
      const ret = body.getDescendantsOfKind(SyntaxKind.ReturnStatement).find((r) => {
        const ancestorFn = r.getFirstAncestor(
          (a) =>
            Node.isArrowFunction(a) ||
            Node.isFunctionDeclaration(a) ||
            Node.isFunctionExpression(a),
        );
        return ancestorFn === body || ancestorFn === body.getParent();
      });
      const expr = ret?.getExpression();
      if (!expr) continue;
      const root =
        expr.asKind(SyntaxKind.JsxElement)?.getOpeningElement() ??
        expr.asKind(SyntaxKind.JsxSelfClosingElement) ??
        expr
          .asKind(SyntaxKind.ParenthesizedExpression)
          ?.getExpression()
          ?.asKind(SyntaxKind.JsxElement)
          ?.getOpeningElement() ??
        expr
          .asKind(SyntaxKind.ParenthesizedExpression)
          ?.getExpression()
          ?.asKind(SyntaxKind.JsxSelfClosingElement);
      if (!root) continue;
      if (hasAttr(root as Opening, "data-slot")) continue;
      (root as Opening).addAttribute({ name: "data-slot", initializer: `"${kebab(name)}"` });
      elementsMarked++;
      touched = true;
    }
  }

  if (touched) {
    filesTouched++;
    if (!DRY) sf.saveSync();
  }
}

console.log(
  `codemod-data-slot: ${elementsMarked} root element(s) marked across ${filesTouched} file(s)${DRY ? " (dry-run)" : ""}.`,
);
