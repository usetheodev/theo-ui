import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { cn } from "../lib/cn.js";
import { useTheme } from "./theme-provider.js";

interface ThemeSwitcherProps {
  className?: string;
  /** If true, renders mode toggle inline next to the theme menu. */
  showModeToggle?: boolean;
}

/**
 * ThemeSwitcher — drop-in theme + mode picker.
 *
 * Two affordances:
 *   - Palette dropdown lists all registered themes with the active marked.
 *   - Optional sun/moon button toggles light/dark.
 *
 * Stateless wrt itself — pulls state from `useTheme()`.
 */
function ThemeSwitcher({ className, showModeToggle = true }: ThemeSwitcherProps): JSX.Element {
  const { theme, themes, setTheme, mode, toggleMode } = useTheme();

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`Theme: ${theme.label}`}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card px-3",
              "font-medium font-sans text-body-sm text-foreground",
              "transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <Palette className="size-4 text-primary" aria-hidden />
            <span>{theme.label}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className={cn(
              "z-50 min-w-[16rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
            )}
          >
            {themes.map((t) => (
              <DropdownMenu.Item
                key={t.name}
                onSelect={() => setTheme(t.name)}
                className={cn(
                  "flex cursor-pointer items-start justify-between gap-3 rounded-md px-2 py-2",
                  "focus:bg-muted focus:outline-none data-[highlighted]:bg-muted",
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-body-sm">{t.label}</span>
                  {t.description ? (
                    <span className="text-body-sm text-muted-foreground">{t.description}</span>
                  ) : null}
                </span>
                {t.name === theme.name ? (
                  <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {showModeToggle ? (
        <button
          type="button"
          onClick={toggleMode}
          aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card",
            "text-foreground transition-colors hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          {mode === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      ) : null}
    </div>
  );
}

export { ThemeSwitcher };
