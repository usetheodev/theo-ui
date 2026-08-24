import type { GlobalProvider } from "@ladle/react";
import "../src/styles/global.css";
import { builtinThemes } from "../src/themes/index.js";
import { ThemeProvider } from "../src/themes/theme-provider.js";

export const Provider: GlobalProvider = ({ children, globalState }) => {
  const mode = globalState.theme === "dark" ? "dark" : "light";
  return (
    <ThemeProvider themes={builtinThemes} defaultMode={mode} storageKey={null}>
      <div className="min-h-screen bg-background bg-dotted-violet text-foreground">
        <div className="container py-12">{children}</div>
      </div>
    </ThemeProvider>
  );
};
