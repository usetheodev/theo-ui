import { ChevronsUpDown } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Avatar } from "../../primitives/avatar/index.js";
import { PlanBadge, type PlanTier } from "../../primitives/plan-badge/index.js";

/**
 * AccountMenu — sidebar header for PaaS surfaces.
 *
 * Renders avatar + name + (optional) plan badge + (optional) secondary line.
 * Dual mode: with `onClick`, renders as a `<button>` with a `ChevronsUpDown`
 * trailing icon (account picker affordance); without, renders as a static
 * `<div>` (read-only display, not focusable).
 *
 * Composition:
 *
 *   <Sidebar.Header className="p-0">
 *     <AccountMenu
 *       name="paulohenriquevn"
 *       avatar="https://avatars.githubusercontent.com/u/12345"
 *       plan="hobby"
 *       onClick={openAccountSwitcher}
 *     />
 *   </Sidebar.Header>
 *
 * Avatar handling:
 *   - URL (`http(s)://` or `/`) → `<Avatar.Image>` with `<Avatar.Fallback>` initials
 *   - Short string (≤2 chars) → treated as initials directly
 *   - Undefined → initials derived from the first character of `name`
 *
 * PaaS-shape sibling of `<ProjectSwitcher>` (workspace + branch + agent-status).
 * Same dual-mode (interactive vs static) pattern; different semantics.
 */

export interface AccountMenuProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children" | "name"> {
  /** Display name (username, email, org name). */
  name: ReactNode;
  /** Avatar URL or 1-2-char initials. If undefined, derives initials from `name`. */
  avatar?: string;
  /** Plan tier — renders inline `<PlanBadge size="sm">`. Omit for none. */
  plan?: PlanTier;
  /** Optional secondary line below name (e.g. email). */
  secondary?: ReactNode;
  /** Make the row interactive (button) with a trailing chevron. */
  onClick?: () => void;
}

const URL_RE = /^(?:https?:\/\/|\/)/;

function deriveInitials(name: ReactNode, avatar: string | undefined): string {
  if (avatar && !URL_RE.test(avatar) && avatar.length <= 2) {
    return avatar.toUpperCase();
  }
  if (typeof name === "string" && name.length > 0) {
    return name.charAt(0).toUpperCase();
  }
  return "?";
}

const AccountMenu = forwardRef<HTMLElement, AccountMenuProps>(
  ({ className, name, avatar, plan, secondary, onClick, ...props }, ref) => {
    const interactive = typeof onClick === "function";
    const initials = deriveInitials(name, avatar);
    const isUrlAvatar = avatar !== undefined && URL_RE.test(avatar);
    const altText = typeof name === "string" ? name : "account";

    const content = (
      <>
        <Avatar size="sm">
          {isUrlAvatar ? <Avatar.Image src={avatar} alt={altText} /> : null}
          <Avatar.Fallback delayMs={0}>{initials}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-body-sm text-foreground">{name}</span>
            {plan ? <PlanBadge plan={plan} size="sm" /> : null}
          </div>
          {secondary ? (
            <span className="truncate text-label text-muted-foreground">{secondary}</span>
          ) : null}
        </div>

        {interactive ? (
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : null}
      </>
    );

    const baseClass = cn(
      "flex w-full items-center gap-3 px-3 py-2",
      interactive &&
        cn(
          "rounded-md text-left transition-colors",
          "hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        ),
      className,
    );

    if (interactive) {
      const { ...buttonProps } = props as ButtonHTMLAttributes<HTMLButtonElement>;
      return (
        <button
          data-slot="account-menu"
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={baseClass}
          onClick={onClick}
          {...buttonProps}
        >
          {content}
        </button>
      );
    }

    return (
      <div
        data-slot="account-menu"
        ref={ref as React.Ref<HTMLDivElement>}
        className={baseClass}
        {...(props as HTMLAttributes<HTMLDivElement>)}
      >
        {content}
      </div>
    );
  },
);
AccountMenu.displayName = "AccountMenu";

export { AccountMenu };
