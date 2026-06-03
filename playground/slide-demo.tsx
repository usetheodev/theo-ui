import { Button } from "@theokit/ui";
import { Slide, type SlideValidationError } from "@theokit/ui/slide";
import "@theokit/ui/slide/themes/default.css";
import "@theokit/ui/slide/themes/violet-forge.css";
import { useCallback, useState } from "react";
import { SLIDE_SCENES, type SlideScene } from "./slide-scenes.js";

type SurfaceMode = "light" | "dark" | "auto";

interface SceneCardProps {
  scene: SlideScene;
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
  const [errors, setErrors] = useState<SlideValidationError[]>([]);
  const surface = surfaceClasses(surfaceMode);
  const handleErrors = useCallback((errs: SlideValidationError[]) => setErrors(errs), []);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            #{String(index + 1).padStart(2, "0")} · {scene.id}
          </div>
          <h2 className="font-display text-title-md tracking-tight">{scene.title}</h2>
          <p className="mt-1 max-w-prose text-body-md text-muted-foreground">{scene.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-muted-foreground text-xs">
          {scene.theme ? <span>theme: {scene.theme}</span> : null}
          {scene.aspectRatio ? (
            <span>
              aspect:{" "}
              {typeof scene.aspectRatio === "string"
                ? scene.aspectRatio
                : `${scene.aspectRatio.width}×${scene.aspectRatio.height}`}
            </span>
          ) : null}
          {scene.expectError ? <span className="text-destructive">expects error</span> : null}
        </div>
      </div>
      <div
        className={`relative h-[360px] overflow-hidden rounded-lg border border-border/40 ${surface}`}
      >
        <Slide
          markdown={scene.markdown}
          theme={scene.theme}
          aspectRatio={scene.aspectRatio}
          aria-label={scene.title}
          onValidationError={handleErrors}
        />
      </div>
      {errors.length > 0 ? (
        <details
          open={scene.expectError}
          className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-body-md"
        >
          <summary className="cursor-pointer font-medium text-destructive">
            {errors.length} validation error{errors.length === 1 ? "" : "s"}
            {scene.expectError ? " (expected for this scene)" : ""}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            {errors.slice(0, 5).map((e, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: positional, stable for a given input
              <li key={`${e.code}-${i}`}>
                <code className="text-foreground">{e.code}</code>
                {e.path.length > 0 ? (
                  <span className="text-muted-foreground"> @ {e.path.join(".")}</span>
                ) : null}
                <span className="ml-2 text-muted-foreground">— {e.message}</span>
                {e.got !== undefined ? (
                  <span className="ml-2 text-muted-foreground">
                    got: <code className="text-destructive">{JSON.stringify(e.got)}</code>
                  </span>
                ) : null}
              </li>
            ))}
            {errors.length > 5 ? (
              <li className="text-muted-foreground italic">… {errors.length - 5} more</li>
            ) : null}
          </ul>
        </details>
      ) : null}
      <details className="mt-3 rounded-md border border-border/40 bg-muted/30 p-2">
        <summary className="cursor-pointer font-medium text-muted-foreground text-xs uppercase tracking-wide">
          markdown source
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/50 p-2 text-xs">
          {scene.markdown}
        </pre>
      </details>
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
            Slide — visual quality review
          </h1>
          <p className="text-body-md text-muted-foreground">
            {SLIDE_SCENES.length} scenes. Each runs through the same{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;Slide&gt;</code> primitive. Container
            fit recomputes on resize.
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

export function SlideDemo() {
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
        {SLIDE_SCENES.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} surfaceMode={surfaceMode} />
        ))}
      </div>
      <footer className="border-border/40 border-t px-6 py-6 text-body-md text-muted-foreground">
        <p>
          Cada cena passa pelo pipeline completo{" "}
          <code className="rounded bg-muted px-1 py-0.5">parseSlide()</code>: validateSlide →
          parseBody (micromark + GFM) → mdastToHast → sanitizeHast → hastToReact. Erros surgem via{" "}
          <code className="rounded bg-muted px-1 py-0.5">onValidationError</code>; o componente
          nunca lança.
        </p>
        <p className="mt-2">
          <strong>Surface:</strong> Light/Dark forçam o fundo do container · Auto herda do tema do{" "}
          <code className="rounded bg-muted px-1 py-0.5">&lt;ThemeProvider&gt;</code>. Para detalhes
          técnicos, ver{" "}
          <code className="rounded bg-muted px-1 py-0.5">docs/rfcs/0002-slide.md</code>.
        </p>
      </footer>
    </div>
  );
}
