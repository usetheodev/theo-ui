/**
 * Public validator for `WhiteboardScene` JSON. Wraps Zod and converts errors
 * into a structured shape that an LLM can consume to self-correct.
 *
 * Returns `{ ok: true, scene }` on success or `{ ok: false, errors }` with
 * each error carrying `{ path, message, code, got? }`. See RFC 0001 §4.
 */
import { type WhiteboardScene, whiteboardScene } from "./schema.js";

export interface ValidationError {
  /** Dot-joined Zod path, e.g. "elements.2.type" or "width". */
  path: string;
  /** Human-readable explanation (passes through Zod's message). */
  message: string;
  /** Zod issue code: `invalid_type`, `too_small`, `invalid_literal`, ... */
  code: string;
  /** Actual value received at `path`. Populated for type mismatches, discriminator mismatches, and any issue where Zod's `received` is absent but the value can be recovered by walking the original input along `path`. */
  got?: unknown;
}

export type ValidationResult =
  | { ok: true; scene: WhiteboardScene }
  | { ok: false; errors: ValidationError[] };

interface ZodLikeIssue {
  path: ReadonlyArray<string | number>;
  message: string;
  code: string;
  received?: unknown;
}

/** Walk `input` following the issue path and return the offending value. */
function valueAtPath(input: unknown, path: ReadonlyArray<string | number>): unknown {
  let cursor: unknown = input;
  for (const segment of path) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string | number, unknown>)[segment];
  }
  return cursor;
}

function formatIssue(issue: ZodLikeIssue, input: unknown): ValidationError {
  const error: ValidationError = {
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  };
  // Populate `got` from the issue when Zod provides it (invalid_type), or by
  // walking the original input along the path (invalid_union / invalid_value).
  // LLM auto-correction benefits from seeing what was actually emitted.
  if ("received" in issue && issue.received !== undefined) {
    error.got = issue.received;
  } else if (issue.path.length > 0) {
    const value = valueAtPath(input, issue.path);
    if (value !== undefined) error.got = value;
  }
  return error;
}

export function validateScene(input: unknown): ValidationResult {
  const result = whiteboardScene.safeParse(input);
  if (result.success) {
    return { ok: true, scene: result.data };
  }
  const errors = result.error.issues.map((issue) =>
    formatIssue(issue as unknown as ZodLikeIssue, input),
  );
  return { ok: false, errors };
}
