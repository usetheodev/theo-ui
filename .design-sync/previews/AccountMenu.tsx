import { AccountMenu } from "@theokit/ui";

export const Default = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu
      name="paulohenriquevn"
      avatar="https://avatars.githubusercontent.com/u/12345?v=4"
      plan="hobby"
      onClick={() => undefined}
    />
  </div>
);

export const Static = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu name="paulohenriquevn" plan="pro" />
  </div>
);

export const NoAvatar = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu name="Theo" plan="enterprise" onClick={() => undefined} />
  </div>
);

export const WithSecondary = () => (
  <div className="w-72 rounded-lg border border-border/40 bg-card">
    <AccountMenu
      name="paulohenriquevn"
      secondary="paulo@theokit.dev"
      plan="team"
      onClick={() => undefined}
    />
  </div>
);
