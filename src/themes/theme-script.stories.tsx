import type { Story } from "@ladle/react";
import { ThemeScript } from "./theme-script.js";

export default {
  title: "Themes / ThemeScript",
};

/**
 * ThemeScript renders an inline `<script>` for SSR-safe theme bootstrap.
 * It's not visually interesting on its own — this story exists to document
 * the API and show that it doesn't render visible UI.
 */
export const Default: Story = () => (
  <div className="space-y-3 p-6">
    <p className="text-body-md text-muted-foreground">
      ThemeScript is invisible. It renders a `&lt;script&gt;` tag in the DOM that runs before
      hydration. Inspect the DOM tree to see it.
    </p>
    <ThemeScript />
    <p className="font-mono text-code-sm text-muted-foreground">
      Default args: defaultTheme="violet-forge" · defaultMode="dark" · storageKey="theo-ui:theme"
    </p>
  </div>
);

export const WithCustomDefaults: Story = () => (
  <div className="space-y-3 p-6">
    <p className="text-body-md text-muted-foreground">
      Customized for a consumer that wants to default to the aurora terminal in light mode.
    </p>
    <ThemeScript defaultTheme="aurora-terminal" defaultMode="light" />
  </div>
);
