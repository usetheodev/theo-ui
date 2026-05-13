import type { Story } from "@ladle/react";
import {
  Boxes,
  Cog,
  FileCode,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Rocket,
  ScrollText,
  Search,
} from "lucide-react";
import { Sidebar } from "./sidebar.js";

export default { title: "Primitives / Layout / Sidebar" };

export const PaaSDashboard: Story = () => (
  <div className="-m-12 h-[720px] overflow-hidden">
    <Sidebar className="h-full">
      <Sidebar.Header>
        <span className="grid size-8 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground">
          T
        </span>
        <div className="grid">
          <span className="font-display text-title-md leading-none">acme</span>
          <span className="font-mono text-label text-muted-foreground">production</span>
        </div>
      </Sidebar.Header>

      <Sidebar.Section>
        <Sidebar.Item icon={Search}>Search…</Sidebar.Item>
      </Sidebar.Section>

      <Sidebar.Section title="Workspace">
        <Sidebar.Item icon={LayoutDashboard} active>
          Overview
        </Sidebar.Item>
        <Sidebar.Item icon={Rocket} count={3}>
          Deployments
        </Sidebar.Item>
        <Sidebar.Item icon={GitBranch} count="2 PR">
          Preview envs
        </Sidebar.Item>
        <Sidebar.Item icon={ScrollText}>Logs</Sidebar.Item>
        <Sidebar.Item icon={LineChart}>Metrics</Sidebar.Item>
      </Sidebar.Section>

      <Sidebar.Section title="Projects">
        <Sidebar.Item icon={FileCode}>acme-api</Sidebar.Item>
        <Sidebar.Item icon={FileCode}>acme-web</Sidebar.Item>
        <Sidebar.Item icon={Boxes}>acme-worker</Sidebar.Item>
      </Sidebar.Section>

      <Sidebar.Section title="Settings">
        <Sidebar.Item icon={Globe}>Domains</Sidebar.Item>
        <Sidebar.Item icon={KeyRound}>Secrets</Sidebar.Item>
        <Sidebar.Item icon={Cog}>Team</Sidebar.Item>
      </Sidebar.Section>

      <Sidebar.Footer>
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-label-caps">
            AA
          </span>
          <div className="grid">
            <span className="font-medium text-body-sm leading-tight">Alfredo Araujo</span>
            <span className="font-mono text-label text-muted-foreground">Plano Pro</span>
          </div>
        </div>
      </Sidebar.Footer>
    </Sidebar>
  </div>
);
