import { Avatar } from "@theokit/ui";



export const Sizes = () => (
  <div className="flex items-center gap-4">
    {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
      <Avatar key={size} size={size} tone="accent">
        <Avatar.Fallback>AA</Avatar.Fallback>
      </Avatar>
    ))}
  </div>
);

export const Tones = () => (
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

export const WithImage = () => (
  <Avatar size="xl">
    <Avatar.Image src="https://github.com/vercel.png" alt="Vercel" />
    <Avatar.Fallback>VC</Avatar.Fallback>
  </Avatar>
);

export const Group = () => (
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
