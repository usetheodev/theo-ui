import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
// Public-API imports only — no relative paths into `src/`. The Vite alias in
// `playground/vite.config.ts` resolves `@usetheo/ui` to `src/index.ts`, so this
// file demonstrates how a real consumer would wire the library.
import { Button, ThemeProvider, ThemeScript } from "@usetheo/ui";
import "@usetheo/ui/styles.css";
// TheoCodeShell is a screen story (not part of the public API). It's imported
// via relative path because it deliberately lives outside the published
// barrel; the playground composes it on top of the public components below.
import { TheoCodeShell } from "../src/screens/theo-code-shell.js";
import { Catalog } from "./catalog.js";

type View = "shell" | "catalog";

function PlaygroundRoot() {
  const initial: View = (window.location.hash.replace("#", "") as View) || "shell";
  const [view, setView] = useState<View>(initial === "catalog" ? "catalog" : "shell");

  const switchTo = (next: View) => {
    setView(next);
    window.location.hash = next;
  };

  return (
    <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden">
      <header className="flex h-12 items-center justify-between border-border/40 border-b bg-card px-4">
        <span className="font-display text-title-md tracking-tight">@usetheo/ui playground</span>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted p-1">
          <Button
            size="sm"
            variant={view === "shell" ? "primary" : "ghost"}
            onClick={() => switchTo("shell")}
          >
            Shell
          </Button>
          <Button
            size="sm"
            variant={view === "catalog" ? "primary" : "ghost"}
            onClick={() => switchTo("catalog")}
          >
            Catalog
          </Button>
        </div>
      </header>
      <div className="min-h-0 overflow-auto">
        {view === "shell" ? <TheoCodeShell /> : <Catalog />}
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");

createRoot(root).render(
  <StrictMode>
    <ThemeScript defaultTheme="violet-forge" defaultMode="dark" />
    <ThemeProvider defaultTheme="violet-forge" defaultMode="dark">
      <PlaygroundRoot />
    </ThemeProvider>
  </StrictMode>,
);
