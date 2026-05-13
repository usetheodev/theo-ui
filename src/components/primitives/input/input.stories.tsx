import type { Story } from "@ladle/react";
import { Input } from "./input.js";

export default { title: "Primitives / Foundations / Input" };

export const Default: Story = () => (
  <div className="grid max-w-md gap-4">
    <Field id="project" label="Project name">
      <Input id="project" placeholder="acme-api" />
    </Field>
    <Field id="email" label="Email">
      <Input id="email" type="email" placeholder="you@usetheo.dev" />
    </Field>
    <Field id="token" label="API token">
      <Input id="token" type="password" placeholder="••••••••••••" />
    </Field>
    <Field id="disabled" label="Disabled">
      <Input id="disabled" placeholder="read-only" disabled />
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
  children: React.ReactNode;
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
