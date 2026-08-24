import type { Story } from "@ladle/react";
import { useState } from "react";
import { SlideDeck } from "./slide-deck.js";

export default {
  title: "Composites / Engines / SlideDeck",
};

const hostStyle: React.CSSProperties = {
  width: 900,
  height: 540,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 16,
  boxSizing: "border-box",
};

const defaultDeck = `# Welcome to TheoUI

A multi-slide deck rendered from one markdown string.

---

# Navigation

Use ← / → / Space / Home / End or swipe on mobile.

---

# That's it

Press F to enter fullscreen, P or N to open presenter view.`;

export const DefaultDeck: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides={defaultDeck} enableHashRouting={false} />
  </div>
);

export const WithGfmTable: Story = () => {
  const md = `# Quarterly KPIs

| Metric | Q1 | Q2 | Q3 |
| --- | --- | --- | --- |
| Revenue | 1.2M | 1.5M | 1.8M |
| Users | 8k | 12k | 18k |

---

# Insights

Revenue grew **50%** quarter-over-quarter.`;
  return (
    <div style={hostStyle}>
      <SlideDeck slides={md} enableHashRouting={false} />
    </div>
  );
};

export const WithSpeakerNotes: Story = () => {
  const md = `# Pull Request #142

<!-- notes: lembrar de mencionar a queda no p99 -->

Adds rate limiting to the public API.

---

# Implementation

<!-- notes: explicar o trade-off entre token-bucket vs leaky-bucket -->

Token-bucket algorithm with sliding-window guard.`;
  return (
    <div style={hostStyle}>
      <SlideDeck slides={md} enableHashRouting={false} />
    </div>
  );
};

export const WithFragments: Story = () => {
  const md = `# Progressive Reveal

Press → to advance fragments first, then slide.

* First item appears
* Second item appears
* Third item appears

---

# Done

Regular lists (with \`-\`) reveal all at once.

- Always visible
- Always visible
- Always visible`;
  return (
    <div style={hostStyle}>
      <SlideDeck slides={md} enableHashRouting={false} />
    </div>
  );
};

export const WithFadeTransition: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides={defaultDeck} transition="fade" enableHashRouting={false} />
  </div>
);

export const WithSlideTransition: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides={defaultDeck} transition="slide" enableHashRouting={false} />
  </div>
);

export const HashRouting: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides={defaultDeck} initialIndex={1} />
  </div>
);

export const HeadlessLayout: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides={defaultDeck} enableHashRouting={false}>
      <div
        style={{
          display: "grid",
          gridTemplateRows: "1fr auto",
          gap: 12,
          height: "100%",
        }}
      >
        <SlideDeck.Slides />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SlideDeck.Controls />
        </div>
      </div>
    </SlideDeck>
  </div>
);

export const WithThumbnails: Story = () => (
  <div style={{ ...hostStyle, width: 1100 }}>
    <SlideDeck slides={defaultDeck} enableHashRouting={false}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 12,
          height: "100%",
        }}
      >
        <SlideDeck.Thumbnails />
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 8 }}>
          <SlideDeck.Slides />
          <SlideDeck.Controls />
        </div>
      </div>
    </SlideDeck>
  </div>
);

export const PresenterModeOn: Story = () => (
  <div style={hostStyle}>
    <SlideDeck
      slides={
        "# Slide 1\n\n<!-- notes: speaker note 1 -->\n\n---\n\n# Slide 2\n\n<!-- notes: speaker note 2 -->"
      }
      enableHashRouting={false}
    >
      <div style={{ display: "grid", gridTemplateRows: "1fr auto auto", gap: 8, height: "100%" }}>
        <SlideDeck.Slides />
        <SlideDeck.PresenterView />
        <SlideDeck.Controls />
      </div>
    </SlideDeck>
  </div>
);

export const LargeDeck: Story = () => {
  const md = Array.from(
    { length: 50 },
    (_, i) => `# Slide ${i + 1}\n\nContent for slide ${i + 1}.`,
  ).join("\n\n---\n\n");
  return (
    <div style={{ ...hostStyle, width: 1100 }}>
      <SlideDeck slides={md} enableHashRouting={false}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, height: "100%" }}>
          <SlideDeck.Thumbnails />
          <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 8 }}>
            <SlideDeck.Slides />
            <SlideDeck.Controls />
          </div>
        </div>
      </SlideDeck>
    </div>
  );
};

export const EmptyDeck: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides={[]} enableHashRouting={false} />
  </div>
);

export const SingleSlideDeck: Story = () => (
  <div style={hostStyle}>
    <SlideDeck slides="# Only one slide\n\nNo nav needed." enableHashRouting={false} />
  </div>
);

export const ControlledNavigation: Story = () => {
  const [index, setIndex] = useState(0);
  return (
    <div style={hostStyle}>
      <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.7 }}>
        Current index: {index} (controlled via onIndexChange callback)
      </p>
      <SlideDeck slides={defaultDeck} enableHashRouting={false} onIndexChange={setIndex} />
    </div>
  );
};
