import { Button } from "@theokit/ui";
import { Slide, type SlidePlugin } from "@theokit/ui/slide";
import { emojiPlugin } from "@theokit/ui/slide/plugins/emoji";
import { mathPlugin } from "@theokit/ui/slide/plugins/math";
import { mermaidPlugin } from "@theokit/ui/slide/plugins/mermaid";
import { shikiPlugin } from "@theokit/ui/slide/plugins/shiki";
import "@theokit/ui/slide/themes/default.css";
import "@theokit/ui/slide/themes/violet-forge.css";
import "katex/dist/katex.min.css";
import { useMemo, useState } from "react";
import { SLIDE_RICH_SCENES, type SlideRichScene } from "./slide-rich-scenes.js";

type SurfaceMode = "light" | "dark" | "auto";
type SlideThemeName = "default" | "violet-forge";

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

interface SceneCardProps {
  scene: SlideRichScene;
  index: number;
  surfaceMode: SurfaceMode;
  theme: SlideThemeName;
  globalPlugins: SlidePlugin[];
}

function SceneCard({ scene, index, surfaceMode, theme, globalPlugins }: SceneCardProps) {
  const surface = surfaceClasses(surfaceMode);
  // Only attach the plugins the scene requests — keeps each scene's bundle
  // cost identical to what a real consumer would pay.
  const scenePlugins = useMemo(() => {
    if (!scene.plugins) return [];
    const needed = new Set(scene.plugins);
    return globalPlugins.filter((p) =>
      needed.has(p.name as "emoji" | "math" | "mermaid" | "shiki"),
    );
  }, [scene.plugins, globalPlugins]);

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
        <div className="flex flex-col items-end gap-1 text-xs">
          {scene.plugins?.length ? (
            <div className="flex gap-1">
              {scene.plugins.map((p) => (
                <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">Tier 1</span>
          )}
        </div>
      </div>
      <div
        className={`relative h-[420px] overflow-hidden rounded-lg border border-border/40 ${surface}`}
      >
        <Slide
          markdown={scene.markdown}
          plugins={scenePlugins}
          theme={theme}
          aria-label={scene.title}
        />
      </div>
    </div>
  );
}

interface ToolbarProps {
  layout: "fit" | "stack" | "split";
  onLayoutChange: (l: "fit" | "stack" | "split") => void;
  surfaceMode: SurfaceMode;
  onSurfaceModeChange: (m: SurfaceMode) => void;
  theme: SlideThemeName;
  onThemeChange: (t: SlideThemeName) => void;
}

function Toolbar({
  layout,
  onLayoutChange,
  surfaceMode,
  onSurfaceModeChange,
  theme,
  onThemeChange,
}: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 border-border/40 border-b bg-background/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline tracking-tight">
            Slide Rich — Tier 1 + Tier 2 plugins
          </h1>
          <p className="text-body-md text-muted-foreground">
            {SLIDE_RICH_SCENES.length} scenes covering GFM alerts, layouts, backgrounds, Marpit{" "}
            <code className="rounded bg-muted px-1 py-0.5">![bg]()</code>, header/footer/paginate,
            plus Shiki / KaTeX / Mermaid / emoji plugins. Each scene only loads the plugins it
            needs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted p-1">
            <span className="px-2 text-muted-foreground text-xs uppercase tracking-wide">
              Theme
            </span>
            <Button
              size="sm"
              variant={theme === "default" ? "primary" : "ghost"}
              onClick={() => onThemeChange("default")}
            >
              Default
            </Button>
            <Button
              size="sm"
              variant={theme === "violet-forge" ? "primary" : "ghost"}
              onClick={() => onThemeChange("violet-forge")}
            >
              Violet Forge
            </Button>
          </div>
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
              variant={layout === "split" ? "primary" : "ghost"}
              onClick={() => onLayoutChange("split")}
            >
              Two cols
            </Button>
            <Button
              size="sm"
              variant={layout === "stack" ? "primary" : "ghost"}
              onClick={() => onLayoutChange("stack")}
            >
              Stack
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlideRichDemo() {
  const [layout, setLayout] = useState<"fit" | "stack" | "split">("split");
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("light");
  const [theme, setTheme] = useState<SlideThemeName>("violet-forge");

  // Memoize plugin instances so the parser cache stays warm and the highlighter
  // singleton inside Shiki is reused across scenes. Recommended order:
  // emoji → math → mermaid → shiki (RFC 0004 §7).
  const globalPlugins = useMemo<SlidePlugin[]>(
    () => [
      emojiPlugin(),
      mathPlugin(),
      mermaidPlugin(),
      shikiPlugin({ langs: ["ts", "tsx", "js", "python", "rust", "go"] }),
    ],
    [],
  );

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
        theme={theme}
        onThemeChange={setTheme}
      />
      <div className={gridClass}>
        {SLIDE_RICH_SCENES.map((scene, i) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={i}
            surfaceMode={surfaceMode}
            theme={theme}
            globalPlugins={globalPlugins}
          />
        ))}
      </div>
      <footer className="border-border/40 border-t px-6 py-6 text-body-md text-muted-foreground">
        <p>
          Cada cena passa pelo pipeline RFC 0004:{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            parseSlide(markdown, &#123; plugins &#125;)
          </code>{" "}
          → mdast transforms (alerts, Marpit bg, plugin mdast hooks) →{" "}
          <code className="rounded bg-muted px-1 py-0.5">mdastToHast</code> → plugin hast hooks →
          sanitize com schema mergeada → React tree. Plugins falham gracefully (D16: PLUGIN_ERROR
          coletado, slide continua renderizando).
        </p>
        <p className="mt-2">
          <strong>Bundle isolation:</strong> barrel{" "}
          <code className="rounded bg-muted px-1 py-0.5">dist/index.js</code> nunca vendoriza shiki
          / katex / mermaid. Cada plugin é seu próprio sub-subpath{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            @theokit/ui/slide/plugins/&lt;name&gt;
          </code>
          .
        </p>
      </footer>
    </div>
  );
}
