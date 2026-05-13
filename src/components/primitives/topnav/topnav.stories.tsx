import type { Story } from "@ladle/react";
import { Bell, GitBranch, Settings } from "lucide-react";
import { useState } from "react";
import { Badge } from "../badge/badge.js";
import { Button } from "../button/button.js";
import { TopNav } from "./topnav.js";

export default { title: "Primitives / Layout / TopNav" };

export const Default: Story = () => {
  const [mode, setMode] = useState("cowork");
  return (
    <div className="-m-12 overflow-hidden">
      <TopNav>
        <TopNav.Left>
          <TopNav.Breadcrumbs
            items={[
              { label: "acme", href: "#" },
              { label: "acme-api", href: "#" },
              { label: "Deployments" },
            ]}
          />
        </TopNav.Left>
        <TopNav.Center>
          <TopNav.ModeSwitcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "chat", label: "Chat" },
              { value: "cowork", label: "Cowork" },
              { value: "code", label: "Code" },
            ]}
          />
        </TopNav.Center>
        <TopNav.Right>
          <Badge variant="success">
            <Badge.Dot tone="success" pulse /> production · main
          </Badge>
          <Button size="icon" variant="ghost" aria-label="Branch">
            <GitBranch />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Notifications">
            <Bell />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Settings">
            <Settings />
          </Button>
        </TopNav.Right>
      </TopNav>
    </div>
  );
};
