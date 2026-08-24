import type { Story } from "@ladle/react";
import { type SessionSummary, SessionTimeline } from "./session-timeline.js";

export default { title: "Primitives / Agent / SessionTimeline" };

const SESSIONS: SessionSummary[] = [
  {
    id: "1",
    title: "Build the agent components sprint 1+2",
    startedAt: "Today 13:15",
    duration: "47m",
    status: "active",
    model: "Opus 4.7",
    tokens: "184k",
    cost: 5.42,
    messageCount: 22,
  },
  {
    id: "2",
    title: "Migrate theo-desktop to Geist tokens",
    startedAt: "Today 11:02",
    duration: "1h 12m",
    status: "completed",
    model: "Sonnet 4.6",
    tokens: "92k",
    cost: 1.18,
    messageCount: 14,
  },
  {
    id: "3",
    title: "Investigate deploy regression in theo-api",
    startedAt: "Yesterday 16:24",
    duration: "23m",
    status: "failed",
    model: "Opus 4.7",
    tokens: "61k",
    cost: 2.04,
    messageCount: 9,
  },
  {
    id: "4",
    title: "Quick prototype of permission matrix",
    startedAt: "2 days ago",
    duration: "8m",
    status: "aborted",
    model: "Haiku 4.5",
    tokens: "12k",
    cost: 0.04,
    messageCount: 4,
  },
];

export const Default: Story = () => (
  <SessionTimeline className="max-w-3xl" sessions={SESSIONS} onOpen={() => undefined} />
);
