import { Button } from "@usetheo/ui";
import { type ValidationError, Whiteboard } from "@usetheo/ui/whiteboard";
import { useState } from "react";
import { SCENES, type SceneFixture } from "./whiteboard-scenes.js";

type SurfaceMode = "light" | "dark" | "auto";

interface SceneCardProps {
  scene: SceneFixture;
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
      // Auto = follow the page theme via `bg-card text-foreground`. Whatever
      // `<ThemeProvider>` resolved to (light/dark) is what the SVG inherits.
      return "bg-card text-foreground";
  }
}

function SceneCard({ scene, index, surfaceMode }: SceneCardProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const surface = surfaceClasses(surfaceMode);
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
          <span>
            {scene.data.elements.length} {scene.data.elements.length === 1 ? "element" : "elements"}
          </span>
          {scene.fitOnLoad ? <span className="text-primary">fitOnLoad</span> : null}
        </div>
      </div>
      <div className={`overflow-hidden rounded-lg border border-border/40 ${surface}`}>
        <Whiteboard
          data={scene.data}
          fitOnLoad={scene.fitOnLoad}
          aria-label={scene.title}
          className="block max-w-full"
          onValidationError={(errs) => setErrors(errs)}
        />
      </div>
      {errors.length > 0 ? (
        <details className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-body-md">
          <summary className="cursor-pointer font-medium text-destructive">
            {errors.length} validation error{errors.length === 1 ? "" : "s"} (expected for the
            invalid fixture)
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            {errors.slice(0, 5).map((e, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: validation errors are positional and stable for a given input.
              <li key={`${e.path}-${i}`}>
                <code className="text-foreground">{e.path || "(root)"}</code> — {e.message}
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
            Whiteboard — visual quality review
          </h1>
          <p className="text-body-md text-muted-foreground">
            {SCENES.length} scenes. Pan with drag, zoom with wheel. Each scene runs through the same
            `&lt;Whiteboard&gt;` primitive.
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

export function WhiteboardDemo() {
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
        {SCENES.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} surfaceMode={surfaceMode} />
        ))}
      </div>
      <footer className="border-border/40 border-t px-6 py-6 text-body-md text-muted-foreground">
        <p>
          Drag mouse para pan · wheel para zoom · Space + drag = hand mode · `fitOnLoad` flag mostra
          o `useViewport.fitTo` em ação. Para detalhes técnicos, consulte
          <code className="ml-1 rounded bg-muted px-1.5 py-0.5">docs/rfcs/0001-whiteboard.md</code>.
        </p>
        <p className="mt-2">
          <strong>Surface:</strong> Light força fundo branco e texto escuro · Dark força fundo
          escuro e texto claro · Auto herda do tema ativo do `&lt;ThemeProvider&gt;`. Cenas com{" "}
          <code className="rounded bg-muted px-1 py-0.5">background</code> fixo no JSON sobrescrevem
          o fundo do container (correto — o JSON manda).
        </p>
      </footer>
    </div>
  );
}
