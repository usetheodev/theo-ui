import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TheoCodeShell } from "../src/screens/theo-code-shell.js";
import { ThemeProvider } from "../src/themes/theme-provider.js";
import "../src/styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");

createRoot(root).render(
  <StrictMode>
    <ThemeProvider defaultTheme="violet-forge">
      <TheoCodeShell />
    </ThemeProvider>
  </StrictMode>,
);
