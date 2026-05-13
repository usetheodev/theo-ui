import type { Story } from "@ladle/react";
import { Inbox, Plus, Rocket } from "lucide-react";
import { Button } from "../button/button.js";
import { EmptyState } from "./empty-state.js";

export default { title: "Primitives / Foundations / EmptyState" };

export const NoProjects: Story = () => (
  <EmptyState
    className="max-w-xl"
    icon={Rocket}
    eyebrow="No projects yet"
    title="Forge your first deployment"
    description="Connect a GitHub repo to deploy on every push. Theo handles previews, secrets, and rollback for you."
    action={
      <Button>
        <Plus /> New project
      </Button>
    }
  />
);

export const NoMessages: Story = () => (
  <EmptyState
    className="max-w-xl"
    icon={Inbox}
    title="Start a conversation"
    description="Ask Theo to scaffold a feature, review a PR, or explain part of the codebase."
  />
);
