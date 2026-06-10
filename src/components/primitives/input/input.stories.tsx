import type { Story } from "@ladle/react";
import type { ReactNode } from "react";
import { Input } from "./input.js";

export default { title: "Primitives / Foundations / Input" };

export const Default: Story = () => (
  <div className="grid max-w-md gap-4">
    <Field id="project" label="Project name">
      <Input id="project" placeholder="acme-api" />
    </Field>
    <Field id="email" label="Email">
      <Input id="email" type="email" placeholder="you@theokit.dev" />
    </Field>
    <Field id="token" label="API token">
      <Input id="token" type="password" placeholder="••••••••••••" />
    </Field>
    <Field id="disabled" label="Disabled">
      <Input id="disabled" placeholder="read-only" disabled />
    </Field>
  </div>
);

export const Sizes: Story = () => (
  <div className="grid max-w-md gap-4">
    <Field id="sm" label="Small (sm)">
      <Input id="sm" size="sm" placeholder="32px tall, body-sm text" />
    </Field>
    <Field id="md" label="Medium (md, default)">
      <Input id="md" size="md" placeholder="40px tall, body-md text" />
    </Field>
    <Field id="lg" label="Large (lg)">
      <Input id="lg" size="lg" placeholder="48px tall, body-lg text" />
    </Field>
  </div>
);

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-sans text-label text-muted-foreground uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
