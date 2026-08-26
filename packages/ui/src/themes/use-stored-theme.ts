"use client";

import { useCallback, useEffect, useState } from "react";

import { isDev } from "../lib/env.js";
import { useTheme } from "./theme-provider.js";
import type { Theme } from "./types.js";

/**
 * Keep a theme somebody built across reloads.
 *
 * `ThemeProvider` already persists WHICH theme is active and in which mode. It cannot persist a
 * theme that does not exist in code: a palette assembled in the editor lives only in the React
 * tree, so a reload took it away and the person built it again. That is the gap between a demo and
 * a feature.
 *
 * Deliberately a hook rather than something the editor does by itself. `ThemeEditor` hands back a
 * `Theme` and has no opinion about where it lives — some consumers want `localStorage`, some want a
 * row in their database, some want it in a URL to share. Baking storage into the component would
 * make the first case free and the other two a fork.
 *
 * WHAT IT DOES NOT DO: validate the stored object beyond its shape. `ThemeProvider` already
 * rejects unsafe values at injection time, so a tampered entry produces a dev-time throw there
 * rather than arbitrary CSS here — the check that matters is the one that runs on the way in.
 */

/** Shape check, not a schema. Enough to tell a theme from a truncated write or an old format. */
function looksLikeTheme(value: unknown): value is Theme {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Theme>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.light === "object" &&
    typeof candidate.dark === "object" &&
    typeof candidate.fonts === "object"
  );
}

function warn(message: string, error: unknown): void {
  if (!isDev()) return;
  // biome-ignore lint/suspicious/noConsole: dev-only diagnostic for storage failures
  console.warn(`[@theokit/ui] ${message}`, error);
}

export interface StoredThemeApi {
  /** The theme read from storage on mount, or `undefined` if there was none. */
  stored: Theme | undefined;
  /** Persist a theme and make it active. */
  save: (theme: Theme) => void;
  /** Forget the stored theme. Does not change what is currently applied. */
  clear: () => void;
}

/**
 * Restore a saved theme on mount, and save new ones.
 *
 * The restore runs in an effect rather than during render because `localStorage` does not exist on
 * a server, and reading it while rendering makes the first client paint disagree with the markup
 * that was sent — the flash every theme system has to avoid.
 */
export function useStoredTheme(storageKey = "theo-ui:theme:custom"): StoredThemeApi {
  const { registerTheme, setTheme } = useTheme();
  const [stored, setStored] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch (error) {
      // Private mode, a full quota, a blocked origin. None of them are worth breaking the app for.
      warn(`could not read stored theme (${storageKey})`, error);
      return;
    }
    if (raw === null) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      warn(`stored theme is not valid JSON (${storageKey})`, error);
      return;
    }

    if (!looksLikeTheme(parsed)) {
      warn(`stored theme has the wrong shape and was ignored (${storageKey})`, parsed);
      return;
    }

    setStored(parsed);
    registerTheme(parsed);
    setTheme(parsed.name);
  }, [storageKey, registerTheme, setTheme]);

  const save = useCallback(
    (theme: Theme) => {
      setStored(theme);
      registerTheme(theme);
      setTheme(theme.name);

      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(theme));
      } catch (error) {
        // The theme is applied either way. Failing to persist is worth a warning, not a broken UI.
        warn(`could not persist theme (${storageKey})`, error);
      }
    },
    [storageKey, registerTheme, setTheme],
  );

  const clear = useCallback(() => {
    setStored(undefined);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      warn(`could not clear stored theme (${storageKey})`, error);
    }
  }, [storageKey]);

  return { stored, save, clear };
}
