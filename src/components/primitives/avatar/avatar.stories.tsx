import type { Story } from "@ladle/react";
import { Avatar } from "./avatar.js";

export default { title: "Primitives / Foundations / Avatar" };

export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
      <Avatar key={size} size={size} tone="accent">
        <Avatar.Fallback>AA</Avatar.Fallback>
      </Avatar>
    ))}
  </div>
);

export const Tones: Story = () => (
  <div className="flex items-center gap-4">
    <Avatar size="lg" tone="muted">
      <Avatar.Fallback>MU</Avatar.Fallback>
    </Avatar>
    <Avatar size="lg" tone="primary">
      <Avatar.Fallback>PR</Avatar.Fallback>
    </Avatar>
    <Avatar size="lg" tone="accent">
      <Avatar.Fallback>AC</Avatar.Fallback>
    </Avatar>
  </div>
);

export const WithImage: Story = () => (
  <Avatar size="xl">
    <Avatar.Image src="https://github.com/vercel.png" alt="Vercel" />
    <Avatar.Fallback>VC</Avatar.Fallback>
  </Avatar>
);

export const Group: Story = () => (
  <div className="flex">
    {["PA", "AA", "TH", "+3"].map((label, i) => (
      <Avatar
        key={label}
        size="md"
        tone={i === 0 ? "primary" : i === 1 ? "accent" : "muted"}
        className={i > 0 ? "-ml-2 ring-2 ring-background" : "ring-2 ring-background"}
      >
        <Avatar.Fallback>{label}</Avatar.Fallback>
      </Avatar>
    ))}
  </div>
);
