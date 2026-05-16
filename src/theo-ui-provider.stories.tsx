import type { Story } from "@ladle/react";
import { Button } from "./components/primitives/button/button.js";
import { TheoUIProvider } from "./theo-ui-provider.js";

/**
 * Demonstrates the recommended primary entry point.
 *
 * `<TheoUIProvider>` composes `<ThemeProvider>` + `<Toaster>` so consumer
 * apps only wrap the root once.
 */
export default {
  title: "Providers / TheoUIProvider",
};

export const Default: Story = () => (
  <TheoUIProvider>
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="mb-2 font-display text-display-md">Primary entry point</h2>
      <p className="mb-4 text-body-md text-muted-foreground">
        Wrap your app root with the TheoUIProvider component. Theme and toasts are wired with
        sensible defaults (violet-forge, dark mode, bottom-right toaster).
      </p>
      <Button>Provider stack ready</Button>
    </div>
  </TheoUIProvider>
);

export const LightMode: Story = () => (
  <TheoUIProvider theme={{ defaultMode: "light", storageKey: null }}>
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="mb-2 font-display text-display-md">Light mode override</h2>
      <p className="mb-4 text-body-md text-muted-foreground">
        Pass <code>defaultMode</code> via the <code>theme</code> prop to flip the initial mode
        without leaving the wrapper.
      </p>
      <Button>Light</Button>
    </div>
  </TheoUIProvider>
);

export const CustomTheme: Story = () => (
  <TheoUIProvider theme={{ defaultTheme: "classic-paper", storageKey: null }}>
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="mb-2 font-display text-display-md">Classic paper</h2>
      <p className="mb-4 text-body-md text-muted-foreground">
        Pick any registered theme by name via the <code>theme</code> prop.
      </p>
      <Button>Classic</Button>
    </div>
  </TheoUIProvider>
);

export const TopLeftToaster: Story = () => (
  <TheoUIProvider toaster={{ position: "top-left" }}>
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="mb-2 font-display text-display-md">Custom toaster position</h2>
      <p className="mb-4 text-body-md text-muted-foreground">
        Pass <code>position</code> via the <code>toaster</code> prop to move the toast viewport
        without touching the inner Toaster instance.
      </p>
      <Button>Toaster anchored top-left</Button>
    </div>
  </TheoUIProvider>
);
