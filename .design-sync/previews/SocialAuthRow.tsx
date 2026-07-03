import { Github } from "lucide-react";
import type { SVGProps } from "react";
import { SocialAuthRow } from "@theokit/ui";



const GoogleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <title>Google</title>
    <path d="M12 11v3.4h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 4 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.7-3.7 8.7-8.9 0-.6-.1-1.1-.2-1.6L12 11z" />
  </svg>
);

const PROVIDERS = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "github", label: "GitHub", icon: Github },
];

export const Variants = () => (
  <div className="grid max-w-md gap-6">
    <section className="grid gap-2">
      <p className="font-mono text-label-caps text-muted-foreground uppercase">Horizontal</p>
      <SocialAuthRow providers={PROVIDERS} />
    </section>
    <section className="grid gap-2">
      <p className="font-mono text-label-caps text-muted-foreground uppercase">Vertical</p>
      <SocialAuthRow
        vertical
        providers={[
          { id: "google", label: "Continue with Google", icon: GoogleIcon },
          { id: "github", label: "Continue with GitHub", icon: Github },
        ]}
      />
    </section>
  </div>
);
