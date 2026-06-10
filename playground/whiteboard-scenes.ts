/**
 * Scene fixtures for the Whiteboard playground.
 *
 * Theming strategy:
 *   - Most scenes omit `background`, `fill`, and explicit `stroke` so the
 *     SVG inherits the surface via `currentColor`. They adapt to the demo's
 *     Surface toggle (Light / Dark / Auto) automatically.
 *   - A handful of scenes intentionally keep fixed colors because the color
 *     itself IS the point of the scene (palette, opacity demonstrations).
 *     Their descriptions flag this explicitly.
 *   - `fillStyle: "hachure"` with `fill: "currentColor"` lets rough.js draw
 *     theme-aware hatching — the lines pick up the inherited color.
 */
import type { WhiteboardData } from "@theokit/ui/whiteboard";

export interface SceneFixture {
  id: string;
  title: string;
  description: string;
  data: WhiteboardData;
  fitOnLoad?: boolean;
}

export const themeAgnosticScene: WhiteboardData = {
  version: 1,
  width: 720,
  height: 400,
  elements: [
    { type: "rect", x: 40, y: 60, w: 160, h: 70, label: "Browser" },
    { type: "rect", x: 280, y: 60, w: 160, h: 70, label: "API" },
    { type: "ellipse", x: 520, y: 60, w: 160, h: 70, label: "Cache" },
    { type: "arrow", x: 200, y: 95, to: [280, 95], label: "request" },
    { type: "arrow", x: 440, y: 95, to: [520, 95], label: "lookup" },
    { type: "diamond", x: 280, y: 200, w: 160, h: 90, label: "Hit?" },
    { type: "arrow", x: 360, y: 130, to: [360, 200] },
    { type: "arrow", x: 440, y: 245, to: [600, 200], label: "yes" },
    { type: "arrow", x: 360, y: 290, to: [360, 360], label: "no" },
    { type: "rect", x: 280, y: 350, w: 160, h: 40, label: "Origin" },
    {
      type: "text",
      x: 40,
      y: 330,
      text: "All strokes use currentColor —\nworks in light AND dark",
      fontSize: 14,
      fontFamily: "sans",
    },
  ],
};

export const architectureScene: WhiteboardData = {
  version: 1,
  width: 820,
  height: 460,
  elements: [
    {
      type: "rect",
      x: 40,
      y: 180,
      w: 140,
      h: 80,
      label: "Browser",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 280,
      y: 60,
      w: 180,
      h: 80,
      label: "Edge Cache",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 280,
      y: 300,
      w: 180,
      h: 80,
      label: "API Server",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    {
      type: "ellipse",
      x: 580,
      y: 60,
      w: 160,
      h: 80,
      label: "CDN",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    {
      type: "ellipse",
      x: 580,
      y: 300,
      w: 160,
      h: 80,
      label: "Postgres",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    { type: "arrow", x: 180, y: 215, to: [280, 100], label: "GET /static" },
    { type: "arrow", x: 180, y: 245, to: [280, 340], label: "POST /api" },
    { type: "arrow", x: 460, y: 100, to: [580, 100] },
    { type: "arrow", x: 460, y: 340, to: [580, 340] },
    {
      type: "text",
      x: 40,
      y: 400,
      text: "Edge → Origin pattern",
      fontSize: 16,
      fontFamily: "sans",
      align: "left",
    },
  ],
};

export const flowchartScene: WhiteboardData = {
  version: 1,
  width: 760,
  height: 480,
  elements: [
    {
      type: "ellipse",
      x: 300,
      y: 30,
      w: 160,
      h: 60,
      label: "Start",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    { type: "rect", x: 280, y: 140, w: 200, h: 70, label: "Read input" },
    {
      type: "diamond",
      x: 280,
      y: 250,
      w: 200,
      h: 110,
      label: "Valid?",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 540,
      y: 270,
      w: 180,
      h: 70,
      label: "Reject",
      fill: "currentColor",
      fillStyle: "cross-hatch",
    },
    {
      type: "rect",
      x: 280,
      y: 400,
      w: 200,
      h: 60,
      label: "Process",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    { type: "arrow", x: 380, y: 90, to: [380, 140] },
    { type: "arrow", x: 380, y: 210, to: [380, 250] },
    { type: "arrow", x: 480, y: 305, to: [540, 305], label: "no" },
    { type: "arrow", x: 380, y: 360, to: [380, 400], label: "yes" },
  ],
};

export const mindMapScene: WhiteboardData = {
  version: 1,
  width: 820,
  height: 540,
  elements: [
    {
      type: "ellipse",
      x: 330,
      y: 230,
      w: 160,
      h: 80,
      label: "Whiteboard",
      fill: "currentColor",
      fillStyle: "cross-hatch",
      strokeWidth: 2,
    },
    // Top branch
    { type: "rect", x: 340, y: 30, w: 140, h: 50, label: "JSON v1" },
    { type: "arrow", x: 410, y: 230, to: [410, 80], headEnd: false },
    // Right branch
    { type: "rect", x: 580, y: 60, w: 140, h: 50, label: "SVG render" },
    { type: "arrow", x: 490, y: 250, to: [580, 90], headEnd: false },
    { type: "rect", x: 600, y: 180, w: 140, h: 50, label: "Pan + Zoom" },
    { type: "arrow", x: 490, y: 270, to: [600, 200], headEnd: false },
    { type: "rect", x: 600, y: 300, w: 140, h: 50, label: "Hand-drawn" },
    { type: "arrow", x: 490, y: 290, to: [600, 320], headEnd: false },
    // Bottom branch
    { type: "rect", x: 340, y: 440, w: 140, h: 50, label: "View-only" },
    { type: "arrow", x: 410, y: 310, to: [410, 440], headEnd: false },
    // Left branch
    { type: "rect", x: 80, y: 60, w: 160, h: 50, label: "rough.js" },
    { type: "arrow", x: 330, y: 250, to: [240, 90], headEnd: false },
    { type: "rect", x: 60, y: 300, w: 180, h: 50, label: "perfect-freehand" },
    { type: "arrow", x: 330, y: 290, to: [240, 320], headEnd: false },
  ],
};

export const sequenceScene: WhiteboardData = {
  version: 1,
  width: 760,
  height: 500,
  elements: [
    { type: "rect", x: 40, y: 30, w: 100, h: 50, label: "Client" },
    { type: "rect", x: 320, y: 30, w: 100, h: 50, label: "API" },
    { type: "rect", x: 600, y: 30, w: 100, h: 50, label: "DB" },
    // Lifelines
    { type: "line", x: 90, y: 80, to: [90, 460], strokeStyle: "dashed", opacity: 0.5 },
    { type: "line", x: 370, y: 80, to: [370, 460], strokeStyle: "dashed", opacity: 0.5 },
    { type: "line", x: 650, y: 80, to: [650, 460], strokeStyle: "dashed", opacity: 0.5 },
    // Messages
    { type: "arrow", x: 90, y: 130, to: [370, 130], label: "POST /login" },
    { type: "arrow", x: 370, y: 200, to: [650, 200], label: "SELECT user" },
    {
      type: "arrow",
      x: 650,
      y: 260,
      to: [370, 260],
      label: "row",
      strokeStyle: "dashed",
    },
    {
      type: "arrow",
      x: 370,
      y: 330,
      to: [90, 330],
      label: "200 + token",
      strokeStyle: "dashed",
    },
    {
      type: "text",
      x: 40,
      y: 460,
      text: "Login flow",
      fontSize: 14,
      fontFamily: "sans",
      align: "left",
    },
  ],
};

export const fillStylesScene: WhiteboardData = {
  version: 1,
  width: 720,
  height: 220,
  elements: [
    {
      type: "rect",
      x: 30,
      y: 40,
      w: 140,
      h: 100,
      label: "hachure",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    {
      type: "rect",
      x: 200,
      y: 40,
      w: 140,
      h: 100,
      label: "solid",
      fill: "currentColor",
      fillStyle: "solid",
      opacity: 0.4,
    },
    {
      type: "rect",
      x: 370,
      y: 40,
      w: 140,
      h: 100,
      label: "cross-hatch",
      fill: "currentColor",
      fillStyle: "cross-hatch",
    },
    {
      type: "rect",
      x: 540,
      y: 40,
      w: 140,
      h: 100,
      label: "zigzag",
      fill: "currentColor",
      fillStyle: "zigzag",
    },
    {
      type: "text",
      x: 30,
      y: 170,
      text: "Fill styles comparison",
      fontSize: 14,
      fontFamily: "sans",
    },
  ],
};

export const roughnessScene: WhiteboardData = {
  version: 1,
  width: 720,
  height: 220,
  elements: [
    { type: "rect", x: 30, y: 40, w: 140, h: 100, label: "0 (clean)", roughness: 0 },
    { type: "rect", x: 200, y: 40, w: 140, h: 100, label: "1", roughness: 1 },
    { type: "rect", x: 370, y: 40, w: 140, h: 100, label: "2", roughness: 2 },
    { type: "rect", x: 540, y: 40, w: 140, h: 100, label: "3 (max)", roughness: 3 },
    {
      type: "text",
      x: 30,
      y: 170,
      text: "Roughness scale 0→3",
      fontSize: 14,
      fontFamily: "sans",
    },
  ],
};

export const strokeStylesScene: WhiteboardData = {
  version: 1,
  width: 720,
  height: 240,
  elements: [
    { type: "line", x: 30, y: 60, to: [690, 60], strokeWidth: 2 },
    { type: "text", x: 30, y: 75, text: "solid", fontSize: 12, fontFamily: "sans" },
    {
      type: "line",
      x: 30,
      y: 120,
      to: [690, 120],
      strokeWidth: 2,
      strokeStyle: "dashed",
    },
    { type: "text", x: 30, y: 135, text: "dashed", fontSize: 12, fontFamily: "sans" },
    {
      type: "line",
      x: 30,
      y: 180,
      to: [690, 180],
      strokeWidth: 2,
      strokeStyle: "dotted",
    },
    { type: "text", x: 30, y: 195, text: "dotted", fontSize: 12, fontFamily: "sans" },
  ],
};

export const typographyScene: WhiteboardData = {
  version: 1,
  width: 760,
  height: 380,
  elements: [
    { type: "text", x: 40, y: 30, text: "hand (default)", fontSize: 24, fontFamily: "hand" },
    { type: "text", x: 40, y: 80, text: "sans family", fontSize: 24, fontFamily: "sans" },
    { type: "text", x: 40, y: 130, text: "serif family", fontSize: 24, fontFamily: "serif" },
    { type: "text", x: 40, y: 180, text: "monospace family", fontSize: 24, fontFamily: "mono" },
    {
      type: "text",
      x: 40,
      y: 240,
      text: "Multi-line text\nwith three lines\nleft-aligned",
      fontSize: 18,
      fontFamily: "sans",
      align: "left",
    },
    {
      type: "text",
      x: 600,
      y: 240,
      text: "Centered\nmulti-line\ntext block",
      fontSize: 18,
      fontFamily: "sans",
      align: "center",
    },
  ],
};

// FREEDRAW — colors are the point (each stroke deliberately different).
// This one is theme-LOCKED. Stays as-is.
export const freedrawScene: WhiteboardData = {
  version: 1,
  width: 700,
  height: 420,
  elements: [
    {
      type: "freedraw",
      x: 50,
      y: 50,
      stroke: "#7c3aed",
      strokeWidth: 2,
      points: [
        [0, 80],
        [40, 60],
        [80, 50],
        [120, 60],
        [160, 80],
        [180, 110],
        [180, 140],
        [160, 170],
        [120, 190],
        [80, 200],
        [40, 190],
        [10, 170],
        [0, 140],
        [0, 80],
      ],
    },
    {
      type: "freedraw",
      x: 280,
      y: 50,
      stroke: "#dc2626",
      strokeWidth: 1.5,
      points: [
        [0, 0],
        [40, 30],
        [80, 60],
        [40, 90],
        [80, 120],
        [120, 90],
        [160, 120],
        [200, 90],
        [240, 60],
        [200, 30],
        [160, 0],
        [120, 30],
        [80, 0],
        [40, 30],
      ],
    },
    {
      type: "freedraw",
      x: 60,
      y: 280,
      stroke: "#0f766e",
      points: [
        [0, 60],
        [20, 30],
        [40, 50],
        [60, 10],
        [80, 50],
        [100, 30],
        [120, 60],
        [140, 20],
        [160, 50],
        [180, 30],
        [200, 60],
        [220, 40],
        [240, 60],
      ],
    },
    {
      type: "text",
      x: 50,
      y: 380,
      text: "Freedraw with perfect-freehand — closed shape, zigzag, freeform line",
      fontSize: 14,
      fontFamily: "sans",
    },
  ],
};

// DENSE — the palette IS the demo. Stays color-locked.
export const denseScene: WhiteboardData = (() => {
  const palette = [
    { fill: "#dbeafe", stroke: "#1e3a8a" },
    { fill: "#dcfce7", stroke: "#166534" },
    { fill: "#fef3c7", stroke: "#92400e" },
    { fill: "#fce7f3", stroke: "#9d174d" },
    { fill: "#ede9fe", stroke: "#6d28d9" },
    { fill: "#cffafe", stroke: "#155e75" },
  ];
  const elements: WhiteboardData["elements"] = [];
  const cols = 8;
  const rows = 5;
  const cellW = 100;
  const cellH = 70;
  const padX = 20;
  const padY = 20;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const color = palette[idx % palette.length];
      const type = idx % 3 === 0 ? "ellipse" : idx % 3 === 1 ? "diamond" : "rect";
      elements.push({
        type,
        x: padX + c * (cellW + 12),
        y: padY + r * (cellH + 14),
        w: cellW,
        h: cellH,
        label: `N${idx}`,
        fill: color?.fill,
        fillStyle: "hachure",
        stroke: color?.stroke,
      });
    }
  }
  for (let i = 0; i < 12; i++) {
    const fromIdx = Math.floor(Math.random() * (cols * rows));
    const toIdx = Math.floor(Math.random() * (cols * rows));
    if (fromIdx === toIdx) continue;
    const fc = fromIdx % cols;
    const fr = Math.floor(fromIdx / cols);
    const tc = toIdx % cols;
    const tr = Math.floor(toIdx / cols);
    elements.push({
      type: "arrow",
      x: padX + fc * (cellW + 12) + cellW / 2,
      y: padY + fr * (cellH + 14) + cellH / 2,
      to: [padX + tc * (cellW + 12) + cellW / 2, padY + tr * (cellH + 14) + cellH / 2],
      stroke: "#64748b",
      strokeWidth: 1,
      opacity: 0.5,
    });
  }
  return {
    version: 1,
    width: cols * (cellW + 12) + padX,
    height: rows * (cellH + 14) + padY + 40,
    elements,
  };
})();

export const edgeCasesScene: WhiteboardData = {
  version: 1,
  width: 760,
  height: 440,
  elements: [
    { type: "rect", x: 40, y: 40, w: 5, h: 100, label: "" },
    {
      type: "text",
      x: 60,
      y: 90,
      text: "Thin (5px wide)",
      fontSize: 12,
      fontFamily: "sans",
    },
    {
      type: "rect",
      x: 200,
      y: 40,
      w: 500,
      h: 30,
      label: "Wide (500x30)",
      fill: "currentColor",
      fillStyle: "hachure",
    },
    { type: "arrow", x: 200, y: 160, to: [220, 160] },
    {
      type: "text",
      x: 240,
      y: 168,
      text: "Short arrow (head clamped via EC-7)",
      fontSize: 12,
      fontFamily: "sans",
    },
    {
      type: "arrow",
      x: 60,
      y: 240,
      to: [700, 380],
      label: "long diagonal",
      strokeWidth: 2,
    },
    {
      type: "arrow",
      x: 60,
      y: 320,
      to: [400, 320],
      label: "bidirectional",
      headStart: true,
      headEnd: true,
    },
    {
      type: "rect",
      x: 40,
      y: 380,
      w: 400,
      h: 40,
      label: "Label that is intentionally quite long",
      fill: "currentColor",
      fillStyle: "hachure",
    },
  ],
};

// OPACITY — fixed color (#7c3aed) is the demo point. Stays theme-locked.
export const opacityScene: WhiteboardData = {
  version: 1,
  width: 640,
  height: 280,
  elements: [
    {
      type: "rect",
      x: 40,
      y: 40,
      w: 140,
      h: 100,
      label: "1.0",
      fill: "#7c3aed",
      stroke: "#7c3aed",
      opacity: 1,
    },
    {
      type: "rect",
      x: 200,
      y: 40,
      w: 140,
      h: 100,
      label: "0.7",
      fill: "#7c3aed",
      stroke: "#7c3aed",
      opacity: 0.7,
    },
    {
      type: "rect",
      x: 360,
      y: 40,
      w: 140,
      h: 100,
      label: "0.4",
      fill: "#7c3aed",
      stroke: "#7c3aed",
      opacity: 0.4,
    },
    {
      type: "text",
      x: 40,
      y: 200,
      text: "Opacity 1.0 / 0.7 / 0.4",
      fontSize: 14,
      fontFamily: "sans",
    },
  ],
};

export const invalidScene = {
  version: 1,
  width: "should be a number",
  height: 200,
  elements: [{ type: "blob", x: 0 }],
};

export const SCENES: SceneFixture[] = [
  {
    id: "theme-agnostic",
    title: "Theme-agnostic (toggle Surface!)",
    description:
      "Zero cores fixas. Mesmo JSON renderiza certo em Light, Dark e Auto — strokes herdam currentColor. Caminho recomendado para consumer que quer dark mode real.",
    data: themeAgnosticScene,
    fitOnLoad: true,
  },
  {
    id: "architecture",
    title: "Architecture diagram",
    description: "Browser → Edge/API → CDN/DB. Hachure fill via currentColor — adapta ao Surface.",
    data: architectureScene,
    fitOnLoad: true,
  },
  {
    id: "flowchart",
    title: "Flowchart with decision",
    description:
      "Classic Start → Process → Decision → Reject/Process. Mix de hachure + cross-hatch via currentColor.",
    data: flowchartScene,
    fitOnLoad: true,
  },
  {
    id: "sequence",
    title: "Sequence diagram",
    description:
      "Dashed lifelines, solid request arrows, dashed reply arrows. Tudo via currentColor.",
    data: sequenceScene,
    fitOnLoad: true,
  },
  {
    id: "mindmap",
    title: "Mind map",
    description:
      "Central concept + branches. Cross-hatch no nó central, edges sem arrowhead. Tudo currentColor.",
    data: mindMapScene,
    fitOnLoad: true,
  },
  {
    id: "fillStyles",
    title: "Fill styles comparison",
    description:
      "hachure / solid (com opacity 0.4) / cross-hatch / zigzag — fill=currentColor mostra que padrão é theme-aware.",
    data: fillStylesScene,
  },
  {
    id: "roughness",
    title: "Roughness scale",
    description: "Mesmo rect com roughness 0, 1, 2, 3.",
    data: roughnessScene,
  },
  {
    id: "strokeStyles",
    title: "Stroke styles",
    description: "Solid / dashed / dotted lines.",
    data: strokeStylesScene,
  },
  {
    id: "typography",
    title: "Typography",
    description: "4 fontFamily + multi-line com align left e center.",
    data: typographyScene,
  },
  {
    id: "freedraw",
    title: "Freedraw strokes (theme-locked)",
    description:
      "Cores fixas — propósito é mostrar 3 estilos distintos via stroke colorido. Não adapta ao Surface.",
    data: freedrawScene,
  },
  {
    id: "dense",
    title: "Dense scene (52 elements)",
    description:
      "Paleta de 6 cores fixas + 40 elementos + 12 arrows. Fundo adapta ao Surface, fills mantêm a paleta.",
    data: denseScene,
    fitOnLoad: true,
  },
  {
    id: "edgeCases",
    title: "Edge cases",
    description:
      "Thin/wide rects, short arrow (head clamp EC-7), bidirectional, long label. Adapta ao Surface.",
    data: edgeCasesScene,
  },
  {
    id: "opacity",
    title: "Opacity",
    description:
      "3 rects em violeta fixo (#7c3aed) com opacity 1.0 / 0.7 / 0.4. Fundo adapta ao Surface.",
    data: opacityScene,
  },
  {
    id: "invalid",
    title: "Invalid JSON (fallback)",
    description:
      "Schema inválido — renderiza SVG vazio com data-whiteboard-state=invalid. Errors expandíveis.",
    data: invalidScene as unknown as WhiteboardData,
  },
];
