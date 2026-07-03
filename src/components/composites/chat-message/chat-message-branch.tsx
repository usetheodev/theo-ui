"use client";

import { Button } from "@usetheo/ui";
/**
 * Message branching navigation — render multiple alternate responses for a
 * single conversation turn and let the user swipe between them.
 *
 * Forked from `vercel/ai-elements` `<MessageBranch*>` family (Apache-2.0,
 * see NOTICE). Adapted to TheoUI primitives — replaces shadcn `Button` +
 * `ButtonGroup` with our `<Button>` (no ButtonGroup primitive yet; rendered
 * as a plain wrapper).
 *
 * Composition:
 *
 *   <ChatMessageBranch>
 *     <ChatMessageBranchContent>
 *       <FirstResponse />
 *       <SecondResponse />
 *       <ThirdResponse />
 *     </ChatMessageBranchContent>
 *     <ChatMessageBranchSelector>
 *       <ChatMessageBranchPrevious />
 *       <ChatMessageBranchPage />
 *       <ChatMessageBranchNext />
 *     </ChatMessageBranchSelector>
 *   </ChatMessageBranch>
 */
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  type ComponentProps,
  type HTMLAttributes,
  type ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "../../../lib/cn.js";

interface MessageBranchContextValue {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextValue | null>(null);

function useMessageBranch(): MessageBranchContextValue {
  const ctx = useContext(MessageBranchContext);
  if (!ctx) {
    throw new Error("ChatMessageBranch* components must be wrapped in <ChatMessageBranch>.");
  }
  return ctx;
}

export type ChatMessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export function ChatMessageBranch({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: ChatMessageBranchProps): JSX.Element {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleChange = useCallback(
    (next: number) => {
      setCurrentBranch(next);
      onBranchChange?.(next);
    },
    [onBranchChange],
  );

  const goToPrevious = useCallback(() => {
    handleChange(currentBranch > 0 ? currentBranch - 1 : branches.length - 1);
  }, [currentBranch, branches.length, handleChange]);

  const goToNext = useCallback(() => {
    handleChange(currentBranch < branches.length - 1 ? currentBranch + 1 : 0);
  }, [currentBranch, branches.length, handleChange]);

  const value = useMemo<MessageBranchContextValue>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious],
  );

  return (
    <MessageBranchContext.Provider data-slot="chat-message-branch" value={value}>
      <div className={cn("grid w-full gap-2", className)} {...props} />
    </MessageBranchContext.Provider>
  );
}

export type ChatMessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export function ChatMessageBranchContent({
  children,
  ...props
}: ChatMessageBranchContentProps): JSX.Element {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? (children as ReactElement[]) : [children as ReactElement]),
    [children],
  );

  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return (
    <>
      {childrenArray.map((branch, idx) => (
        <div
          className={cn("grid gap-2 overflow-hidden", idx === currentBranch ? "block" : "hidden")}
          key={
            // Prefer a stable element key; fall back to index
            (branch as ReactElement)?.key ?? `branch-${idx}`
          }
          {...props}
        >
          {branch}
        </div>
      ))}
    </>
  );
}

export type ChatMessageBranchSelectorProps = HTMLAttributes<HTMLDivElement>;

export function ChatMessageBranchSelector({
  className,
  ...props
}: ChatMessageBranchSelectorProps): JSX.Element | null {
  const { totalBranches } = useMessageBranch();
  if (totalBranches <= 1) return null;
  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-md border border-border", className)}
      role="group"
      aria-label="Branch selector"
      {...props}
    />
  );
}

export type ChatMessageBranchPreviousProps = ComponentProps<typeof Button>;

export function ChatMessageBranchPrevious({
  children,
  ...props
}: ChatMessageBranchPreviousProps): JSX.Element {
  const { goToPrevious, totalBranches } = useMessageBranch();
  return (
    <Button
      data-slot="chat-message-branch-previous"
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      {...props}
    >
      {children ?? <ChevronLeftIcon className="size-3.5" aria-hidden="true" />}
    </Button>
  );
}

export type ChatMessageBranchNextProps = ComponentProps<typeof Button>;

export function ChatMessageBranchNext({
  children,
  ...props
}: ChatMessageBranchNextProps): JSX.Element {
  const { goToNext, totalBranches } = useMessageBranch();
  return (
    <Button
      data-slot="chat-message-branch-next"
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      {...props}
    >
      {children ?? <ChevronRightIcon className="size-3.5" aria-hidden="true" />}
    </Button>
  );
}

export type ChatMessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export function ChatMessageBranchPage({
  className,
  ...props
}: ChatMessageBranchPageProps): JSX.Element {
  const { currentBranch, totalBranches } = useMessageBranch();
  return (
    <span
      data-slot="chat-message-branch-page"
      className={cn(
        "inline-flex items-center px-2 font-mono text-label-caps text-muted-foreground",
        className,
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </span>
  );
}
