import { Button } from "@usetheo/ui";
import { SlideDeck } from "@usetheo/ui/slide-deck";
import "@usetheo/ui/slide/themes/default.css";
import "@usetheo/ui/slide/themes/violet-forge.css";
import { useState } from "react";
import { SLIDE_DECK_SCENES, type SlideDeckScene } from "./slide-deck-scenes.js";

type SurfaceMode = "light" | "dark" | "auto";

interface SceneCardProps {
  scene: SlideDeckScene;
  index: number;
  surfaceMode: SurfaceMode;
}

function surfaceClasses(mode: SurfaceMode): string {
  switch (mode) {
    case "light":
      return "bg-white text-slate-900";
    case "dark":
      return "bg-slate-950 text-slate-100";
    default:
      return "bg-card text-foreground";
  }
}

function SceneCard({ scene, index, surfaceMode }: SceneCardProps) {
  const [currentIndex, setCurrentIndex] = useState(scene.initialIndex ?? 0);
  const surface = surfaceClasses(surfaceMode);

  // Build deck child layout based on flags.
  const deckChildren = scene.showThumbnails ? (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 12,
        height: "100%",
      }}
    >
      <SlideDeck.Thumbnails />
      <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 8, minHeight: 0 }}>
        <SlideDeck.Slides />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <SlideDeck.Controls />
          <SlideDeck.ProgressBar />
        </div>
      </div>
    </div>
  ) : scene.showPresenter ? (
    <div style={{ display: "grid", gridTemplateRows: "1fr auto auto", gap: 8, height: "100%" }}>
      <SlideDeck.Slides />
      <SlideDeck.PresenterView />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <SlideDeck.Controls />
        <div style={{ display: "flex", gap: 4 }}>
          <SlideDeck.PresenterButton />
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            #{String(index + 1).padStart(2, "0")} · {scene.id}
          </div>
          <h2 className="font-display text-title-md tracking-tight">{scene.title}</h2>
          <p className="mt-1 max-w-prose text-body-md text-muted-foreground">
            {scene.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-muted-foreground text-xs">
          <span>current: {currentIndex + 1}</span>
          {scene.transition ? <span>transition: {scene.transition}</span> : null}
          {scene.showThumbnails ? <span className="text-primary">thumbnails</span> : null}
          {scene.showPresenter ? <span className="text-primary">presenter</span> : null}
          {scene.expectError ? <span className="text-destructive">edge case</span> : null}
        </div>
      </div>
      <div
        className={`relative h-[420px] overflow-hidden rounded-lg border border-border/40 ${surface}`}
      >
        <SlideDeck
          slides={scene.slides}
          transition={scene.transition}
          initialIndex={scene.initialIndex}
          enableHashRouting={false}
          onIndexChange={(i) => setCurrentIndex(i)}
          aria-label={scene.title}
        >
          {deckChildren}
        </SlideDeck>
      </div>
    </div>
  );
}

interface ToolbarProps {
  layout: "fit" | "1x" | "split";
  onLayoutChange: (z: "fit" | "1x" | "split") => void;
  surfaceMode: SurfaceMode;
  onSurfaceModeChange: (m: SurfaceMode) => void;
}

function Toolbar({ layout, onLayoutChange, surfaceMode, onSurfaceModeChange }: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 border-border/40 border-b bg-background/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline tracking-tight">
            SlideDeck — visual quality review
          </h1>
          <p className="text-body-md text-muted-foreground">
            {SLIDE_DECK_SCENES.length} scenes. Click a deck and use ← / → / Space / F / N. Each
            scene runs through{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;SlideDeck&gt;</code> with shared
            chrome.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted p-1">
            <span className="px-2 text-muted-foreground text-xs uppercase tracking-wide">
              Surface
            </span>
            <Button
              size="sm"
              variant={surfaceMode === "light" ? "primary" : "ghost"}
              onClick={() => onSurfaceModeChange("light")}
            >
              Light
            </Button>
            <Button
              size="sm"
              variant={surfaceMode === "dark" ? "primary" : "ghost"}
              onClick={() => onSurfaceModeChange("dark")}
            >
              Dark
            </Button>
            <Button
              size="sm"
              variant={surfaceMode === "auto" ? "primary" : "ghost"}
              onClick={() => onSurfaceModeChange("auto")}
            >
              Auto
            </Button>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted p-1">
            <Button
              size="sm"
              variant={layout === "fit" ? "primary" : "ghost"}
              onClick={() => onLayoutChange("fit")}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={layout === "1x" ? "primary" : "ghost"}
              onClick={() => onLayoutChange("1x")}
            >
              Stack
            </Button>
            <Button
              size="sm"
              variant={layout === "split" ? "primary" : "ghost"}
              onClick={() => onLayoutChange("split")}
            >
              Two cols
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlideDeckDemo() {
  const [layout, setLayout] = useState<"fit" | "1x" | "split">("split");
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("light");
  const gridClass =
    layout === "fit"
      ? "grid gap-6 p-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
      : layout === "split"
        ? "grid gap-6 p-6 grid-cols-1 lg:grid-cols-2"
        : "flex flex-col gap-6 p-6";
  return (
    <div className="min-h-full bg-background text-foreground">
      <Toolbar
        layout={layout}
        onLayoutChange={setLayout}
        surfaceMode={surfaceMode}
        onSurfaceModeChange={setSurfaceMode}
      />
      <div className={gridClass}>
        {SLIDE_DECK_SCENES.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} surfaceMode={surfaceMode} />
        ))}
      </div>
      <footer className="border-border/40 border-t px-6 py-6 text-body-md text-muted-foreground">
        <p>
          Cada cena passa pelo pipeline completo:{" "}
          <code className="rounded bg-muted px-1 py-0.5">splitDeck()</code> → useReducer state
          machine → keyboard + swipe + hash routing → fullscreen API → print CSS. Erros surgem
          via callbacks; o componente nunca lança.
        </p>
        <p className="mt-2">
          <strong>Atalhos:</strong> ←/→ navegar · Space avança · Home/End início/fim · F
          fullscreen · N/P presenter · Ctrl+P print. Para detalhes técnicos, ver{" "}
          <code className="rounded bg-muted px-1 py-0.5">docs/rfcs/0003-slide-deck.md</code>.
        </p>
      </footer>
    </div>
  );
}
