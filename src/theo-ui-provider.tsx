"use client";

import type { ComponentProps, JSX, ReactNode } from "react";
import { Toaster } from "./components/primitives/toast/toaster.js";
import { ThemeProvider } from "./themes/theme-provider.js";

/**
 * TheoUIProvider — primary entry point composing `<ThemeProvider>` and
 * `<Toaster>` in the correct order with sensible defaults.
 *
 * Recommended for consumer apps to avoid hand-wiring the provider stack.
 * Equivalent to:
 *
 *   <ThemeProvider {...theme}>
 *     <Toaster {...toaster}>{children}</Toaster>
 *   </ThemeProvider>
 *
 * Notes:
 *   - The `"use client"` directive is required for Next.js App Router (RSC)
 *     because `<ThemeProvider>` uses React state and effects internally.
 *   - `<Tooltip>` provider stays per-instance (Radix recommendation) — this
 *     wrapper does NOT introduce a global tooltip context.
 *   - `<ThemeProvider>` and `<Toaster>` remain independently exported for
 *     consumers who want bespoke control.
 *
 * SSR:
 *   - Place `<ThemeScript>` in `<head>` to avoid FOUC + hydration mismatch.
 *   - Wrap `<html lang="en" suppressHydrationWarning>`.
 *
 * @example
 *   import { TheoUIProvider } from "@usetheo/ui";
 *
 *   export default function App({ children }) {
 *     return <TheoUIProvider>{children}</TheoUIProvider>;
 *   }
 */
export interface TheoUIProviderProps {
  children: ReactNode;
  /** Pass-through props for the inner `<ThemeProvider>`. */
  theme?: Omit<ComponentProps<typeof ThemeProvider>, "children">;
  /** Pass-through props for the inner `<Toaster>`. */
  toaster?: Omit<ComponentProps<typeof Toaster>, "children">;
}

export function TheoUIProvider({ children, theme, toaster }: TheoUIProviderProps): JSX.Element {
  return (
    <ThemeProvider {...theme}>
      <Toaster {...toaster}>{children}</Toaster>
    </ThemeProvider>
  );
}

TheoUIProvider.displayName = "TheoUIProvider";
