// Standalone entry for the Builder parity demo — deliberately separate from
// `main.tsx` (whose catalog imports pre-pivot components no longer in the
// barrel). Run `pnpm playground` and open `/builder-parity.html`.
import { ThemeProvider, ThemeScript, builtinThemes } from "@theokit/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@theokit/ui/styles.css";
import { BuilderParityDemo } from "./builder-parity-demo.js";

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");

createRoot(root).render(
  <StrictMode>
    <ThemeScript defaultTheme="violet-forge" defaultMode="dark" />
    <ThemeProvider themes={builtinThemes} defaultTheme="violet-forge" defaultMode="dark">
      <BuilderParityDemo />
    </ThemeProvider>
  </StrictMode>,
);
