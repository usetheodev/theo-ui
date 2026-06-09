import type { Story } from "@ladle/react";
import { Whiteboard, type WhiteboardData } from "./whiteboard.js";

export default {
  title: "Primitives / Engines / Whiteboard",
};

export const Empty: Story = () => (
  <Whiteboard data={{ version: 1, width: 600, height: 400, elements: [] }} />
);

const flowchart: WhiteboardData = {
  version: 1,
  width: 700,
  height: 360,
  background: "#fefce8",
  elements: [
    {
      type: "rect",
      x: 40,
      y: 40,
      w: 160,
      h: 70,
      label: "Login",
      stroke: "#1f2937",
      fill: "#fde68a",
      fillStyle: "hachure",
    },
    { type: "diamond", x: 270, y: 30, w: 180, h: 90, label: "Token?", stroke: "#1f2937" },
    {
      type: "rect",
      x: 520,
      y: 40,
      w: 160,
      h: 70,
      label: "Home",
      stroke: "#1f2937",
      fill: "#bbf7d0",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 270,
      y: 230,
      w: 180,
      h: 70,
      label: "Refresh",
      stroke: "#1f2937",
      fill: "#fecaca",
      fillStyle: "hachure",
    },
    { type: "arrow", x: 200, y: 75, to: [270, 75], stroke: "#1f2937" },
    { type: "arrow", x: 450, y: 75, to: [520, 75], label: "yes", stroke: "#1f2937" },
    { type: "arrow", x: 360, y: 120, to: [360, 230], label: "no", stroke: "#1f2937" },
    { type: "arrow", x: 360, y: 300, to: [120, 300], stroke: "#1f2937" },
    { type: "arrow", x: 120, y: 300, to: [120, 110], stroke: "#1f2937" },
  ],
};

export const Flowchart: Story = () => <Whiteboard data={flowchart} aria-label="Login flowchart" />;

const architecture: WhiteboardData = {
  version: 1,
  width: 800,
  height: 360,
  background: "#fff",
  elements: [
    {
      type: "rect",
      x: 40,
      y: 140,
      w: 140,
      h: 70,
      label: "Browser",
      fill: "#dbeafe",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 320,
      y: 60,
      w: 160,
      h: 70,
      label: "Edge Cache",
      fill: "#fef3c7",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 320,
      y: 220,
      w: 160,
      h: 70,
      label: "API",
      fill: "#dcfce7",
      fillStyle: "hachure",
    },
    { type: "ellipse", x: 600, y: 60, w: 160, h: 70, label: "CDN" },
    { type: "ellipse", x: 600, y: 220, w: 160, h: 70, label: "Postgres" },
    { type: "arrow", x: 180, y: 175, to: [320, 95], label: "GET /static" },
    { type: "arrow", x: 180, y: 175, to: [320, 255], label: "POST /api" },
    { type: "arrow", x: 480, y: 95, to: [600, 95] },
    { type: "arrow", x: 480, y: 255, to: [600, 255] },
    { type: "text", x: 40, y: 320, text: "Architecture sketch", fontSize: 14, align: "left" },
  ],
};

export const Architecture: Story = () => (
  <Whiteboard data={architecture} aria-label="Service architecture" fitOnLoad />
);

const sketch: WhiteboardData = {
  version: 1,
  width: 480,
  height: 320,
  elements: [
    {
      type: "freedraw",
      x: 0,
      y: 0,
      stroke: "#A855F7",
      points: [
        [40, 40],
        [60, 60],
        [80, 100],
        [120, 130],
        [180, 140],
        [240, 130],
        [280, 100],
        [300, 60],
        [280, 40],
        [220, 30],
        [160, 30],
        [100, 30],
        [40, 40],
      ],
    },
    {
      type: "text",
      x: 40,
      y: 250,
      text: "sketched\nwith perfect-freehand",
      fontSize: 18,
      align: "left",
    },
  ],
};

export const FreedrawSketch: Story = () => (
  <Whiteboard data={sketch} aria-label="Freedraw sketch" />
);

const mixed: WhiteboardData = {
  version: 1,
  width: 720,
  height: 420,
  elements: [
    { type: "rect", x: 40, y: 40, w: 120, h: 60, label: "rect" },
    { type: "ellipse", x: 200, y: 40, w: 120, h: 60, label: "ellipse" },
    { type: "diamond", x: 360, y: 30, w: 120, h: 80, label: "diamond" },
    { type: "line", x: 40, y: 150, to: [480, 150] },
    { type: "arrow", x: 40, y: 200, to: [480, 200], label: "arrow" },
    { type: "text", x: 40, y: 250, text: "Mixed scene — all 7 types", fontSize: 18 },
    {
      type: "freedraw",
      x: 0,
      y: 0,
      points: [
        [40, 320],
        [120, 340],
        [200, 320],
        [280, 360],
        [360, 340],
      ],
    },
  ],
};

export const MixedAll: Story = () => <Whiteboard data={mixed} aria-label="All element types" />;

export const InvalidJSON: Story = () => (
  <Whiteboard
    data={{ totally: "wrong" }}
    aria-label="Invalid JSON fallback"
    onValidationError={(errors) => console.warn("[Whiteboard] invalid data:", errors)}
  />
);
