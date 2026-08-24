import type { Story } from "@ladle/react";
import { type Lane, LaneBoard } from "./lane-board.js";

export default { title: "Primitives / Agent / LaneBoard" };

const LANES: Lane[] = [
  {
    state: "started",
    cards: [
      {
        id: "1",
        title: "Implement Tier 3 components",
        description: "8 new primitives for multi-agent flows.",
        footer: "agent · coder · 12m",
      },
      {
        id: "2",
        title: "Refactor scroll-area tokens",
        description: "Replace rgba with hsl(var) for theme awareness.",
        footer: "agent · coder · 4m",
      },
    ],
  },
  {
    state: "blocked",
    cards: [
      {
        id: "3",
        title: "Publish @theokit/ui to npm",
        description: "Waiting for org access from owner.",
        footer: "blocked by paulo · 1h",
      },
    ],
  },
  {
    state: "failed",
    cards: [
      {
        id: "4",
        title: "Deploy preview env for PR #142",
        description: "k8s cluster unreachable.",
        footer: "agent · ops · 8s ago",
      },
    ],
  },
  {
    state: "finished",
    cards: [
      {
        id: "5",
        title: "Sprint 2 agent components",
        description: "9 primitives shipped.",
        footer: "agent · coder · 1h",
      },
      {
        id: "6",
        title: "Migrate to Geist tokens",
        description: "Vercel-inspired typescale applied.",
        footer: "agent · coder · 2h",
      },
      {
        id: "7",
        title: "Theme system",
        description: "3 built-in themes, runtime swap.",
        footer: "agent · coder · yesterday",
      },
    ],
  },
];

export const Default: Story = () => <LaneBoard title="Agent activity" lanes={LANES} />;
