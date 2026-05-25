// Public-API imports only — no relative paths into `src/`. The Vite alias in
// `playground/vite.config.ts` resolves `@usetheo/ui` to `src/index.ts`, so this
// file demonstrates how a real consumer would wire the library.
import { Button, ThemeProvider, ThemeScript, builtinThemes } from "@usetheo/ui";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@usetheo/ui/styles.css";
// TheoCodeShell is a screen story (not part of the public API). It's imported
// via relative path because it deliberately lives outside the published
// barrel; the playground composes it on top of the public components below.
import { TheoCodeShell } from "../src/screens/theo-code-shell.js";
import { Catalog } from "./catalog.js";
import { DensityDemo } from "./density-demo.js";
import { SlideDeckDemo } from "./slide-deck-demo.js";
import { SlideDemo } from "./slide-demo.js";
import { SlideRichDemo } from "./slide-rich-demo.js";
import { WhiteboardDemo } from "./whiteboard-demo.js";

type View = "shell" | "catalog" | "whiteboard" | "slide" | "slide-deck" | "slide-rich" | "density";

function isView(v: string): v is View {
  return (
    v === "shell" ||
    v === "catalog" ||
    v === "whiteboard" ||
    v === "slide" ||
    v === "slide-deck" ||
    v === "slide-rich" ||
    v === "density"
  );
}

function PlaygroundRoot() {
  const initialHash = window.location.hash.replace("#", "");
  const [view, setView] = useState<View>(isView(initialHash) ? initialHash : "shell");

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
          <Button
            size="sm"
            variant={view === "whiteboard" ? "primary" : "ghost"}
            onClick={() => switchTo("whiteboard")}
          >
            Whiteboard
          </Button>
          <Button
            size="sm"
            variant={view === "slide" ? "primary" : "ghost"}
            onClick={() => switchTo("slide")}
          >
            Slide
          </Button>
          <Button
            size="sm"
            variant={view === "slide-deck" ? "primary" : "ghost"}
            onClick={() => switchTo("slide-deck")}
          >
            Slide Deck
          </Button>
          <Button
            size="sm"
            variant={view === "slide-rich" ? "primary" : "ghost"}
            onClick={() => switchTo("slide-rich")}
          >
            Slide Rich
          </Button>
          <Button
            size="sm"
            variant={view === "density" ? "primary" : "ghost"}
            onClick={() => switchTo("density")}
          >
            Density
          </Button>
        </div>
      </header>
      <div className="min-h-0 overflow-auto">
        {view === "shell" ? (
          <TheoCodeShell />
        ) : view === "catalog" ? (
          <Catalog />
        ) : view === "whiteboard" ? (
          <WhiteboardDemo />
        ) : view === "slide" ? (
          <SlideDemo />
        ) : view === "slide-deck" ? (
          <SlideDeckDemo />
        ) : view === "slide-rich" ? (
          <SlideRichDemo />
        ) : (
          <DensityDemo />
        )}
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");

createRoot(root).render(
  <StrictMode>
    <ThemeScript defaultTheme="violet-forge" defaultMode="dark" />
    <ThemeProvider themes={builtinThemes} defaultTheme="violet-forge" defaultMode="dark">
      <PlaygroundRoot />
    </ThemeProvider>
  </StrictMode>,
);
