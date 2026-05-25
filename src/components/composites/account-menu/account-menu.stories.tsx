import type { Story } from "@ladle/react";
import { AccountMenu } from "./account-menu.js";

export default { title: "Composites / Identity / AccountMenu" };

export const Default: Story = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu
      name="paulohenriquevn"
      avatar="https://avatars.githubusercontent.com/u/12345?v=4"
      plan="hobby"
      onClick={() => undefined}
    />
  </div>
);

export const Static: Story = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu name="paulohenriquevn" plan="pro" />
  </div>
);

export const NoAvatar: Story = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu name="Theo" plan="enterprise" onClick={() => undefined} />
  </div>
);

export const WithSecondary: Story = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu
      name="paulohenriquevn"
      secondary="paulo@usetheo.dev"
      plan="team"
      onClick={() => undefined}
    />
  </div>
);
