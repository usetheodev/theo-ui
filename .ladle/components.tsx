import type { GlobalProvider } from "@ladle/react";
import "../src/styles/global.css";

export const Provider: GlobalProvider = ({ children, globalState }) => {
  const themeClass = globalState.theme === "dark" ? "dark" : "";
  return (
    <div
      className={`${themeClass} min-h-screen bg-background text-foreground bg-dotted-violet`}
      data-theme={globalState.theme}
    >
      <div className="container py-12">{children}</div>
    </div>
  );
};
