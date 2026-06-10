/**
 * Environment helpers — type-safe, browser- and SSR-safe.
 *
 * Why this exists
 * ---------------
 * Component source files in this package need to gate development-only
 * diagnostics (a11y warnings, dev-only `console.warn`, defensive validation
 * messages) on `process.env.NODE_ENV`. Reading `process.env.NODE_ENV`
 * directly in TypeScript triggers `TS2591: Cannot find name 'process'`
 * unless `@types/node` is included in `tsconfig.json#compilerOptions.types`.
 *
 * Adding `node` to that array would work — but it pollutes the ambient
 * global namespace with Node-only APIs (`Buffer`, `fs`, `path`, `Stream`)
 * that have no place in a UI library targeting the browser. Authors would
 * receive autocomplete for `import { readFileSync } from "node:fs"` while
 * writing a React component. That is the wrong trade.
 *
 * The conventional pattern (React, Radix, Stripe Elements, MUI) is to
 * funnel every `NODE_ENV` read through a single typed accessor. Bundlers
 * (Vite, Webpack, esbuild, Rollup, tsup) replace the literal
 * `process.env.NODE_ENV` reference at build time via their `define`
 * mechanism, so this incurs zero runtime cost in the consumer's
 * production build — the dead branch is dead-code-eliminated.
 *
 * Read access is funneled through `globalThis.process?.env?.NODE_ENV`
 * so the helpers work in three environments without ambient types:
 *
 *   - Browser via bundler with `define` (Vite/Webpack): the literal
 *     `process.env.NODE_ENV` is substituted; `globalThis.process` is the
 *     synthesized stub the bundler injects.
 *   - Node (SSR, tests, scripts): `globalThis.process` is the real `process`.
 *   - Browser without bundler injection: `globalThis.process` is undefined
 *     and {@link isDev} returns `true` so developers see warnings during
 *     hand-testing rather than silent failure.
 */

interface NodeEnvCarrier {
  process?: {
    env?: {
      NODE_ENV?: string;
    };
  };
}

function readNodeEnv(): string | undefined {
  return (globalThis as NodeEnvCarrier).process?.env?.NODE_ENV;
}

/**
 * Returns `true` unless `process.env.NODE_ENV === "production"`.
 *
 * Use this to gate development-only branches: a11y warnings, dev-mode
 * `console.warn`, defensive runtime validation. In a consumer's production
 * build the bundler replaces the substituted reference and tree-shakes the
 * dev branch entirely.
 *
 * Defensive default: when `process` is absent (browser without bundler
 * injection), returns `true` to err on the side of more diagnostics.
 */
export function isDev(): boolean {
  return readNodeEnv() !== "production";
}

/**
 * Returns `true` only when `process.env.NODE_ENV === "production"`.
 *
 * Strict inverse of {@link isDev}: when `process` is absent, returns
 * `false`. Use this when you specifically need to confirm a production
 * build (e.g. enabling minified-only optimizations).
 */
export function isProd(): boolean {
  return readNodeEnv() === "production";
}
