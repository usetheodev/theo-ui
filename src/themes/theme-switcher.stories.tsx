import type { Story } from "@ladle/react";
import { Rocket } from "lucide-react";
import { Badge } from "../components/primitives/badge/badge.js";
import { Button } from "../components/primitives/button/button.js";
import { Card } from "../components/primitives/card/card.js";
import { Input } from "../components/primitives/input/input.js";
import { builtinThemes } from "./index.js";
import { ThemeProvider } from "./theme-provider.js";
import { ThemeSwitcher } from "./theme-switcher.js";

export default { title: "Themes / ThemeSwitcher" };

const Showcase = () => (
  <div className="grid gap-6">
    <header className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-display-md tracking-tight">Theme preview</h1>
        <p className="text-body-md text-muted-foreground">
          Swap themes from the picker on the right. State persists in localStorage.
        </p>
      </div>
      <ThemeSwitcher />
    </header>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <Card.Header>
          <Card.Title>Primary CTA</Card.Title>
          <Card.Description>Uses --primary + --shadow-glow on hover.</Card.Description>
        </Card.Header>
        <Card.Body>
          <Input placeholder="some input field" />
        </Card.Body>
        <Card.Footer>
          <Button variant="secondary">Cancel</Button>
          <Button>
            <Rocket /> Deploy
          </Button>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Status palette</Card.Title>
          <Card.Description>Semantic colors react to the active theme.</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">
              <Badge.Dot tone="primary" pulse /> Building
            </Badge>
            <Badge variant="success">
              <Badge.Dot tone="success" /> Deployed
            </Badge>
            <Badge variant="warning">
              <Badge.Dot tone="warning" pulse /> Queued
            </Badge>
            <Badge variant="destructive">
              <Badge.Dot tone="destructive" /> Failed
            </Badge>
            <Badge variant="accent">Beta</Badge>
          </div>
        </Card.Body>
      </Card>
    </div>

    <Card>
      <Card.Header>
        <Card.Title>Typography</Card.Title>
        <Card.Description>--font-display, --font-body, --font-mono swap together.</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="grid gap-2">
          <p className="font-display text-display-md">Display heading sample</p>
          <p className="text-body-md">
            Body — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="font-mono text-code-md">$ theo deploy api web worker</p>
        </div>
      </Card.Body>
    </Card>
  </div>
);

export const AllThemes: Story = () => (
  <ThemeProvider themes={builtinThemes} storageKey={null}>
    <Showcase />
  </ThemeProvider>
);
