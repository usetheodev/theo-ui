import { ChatMessageBranch, ChatMessageBranchContent, ChatMessageResponse, ChatMessageBranchSelector, ChatMessageBranchPrevious, ChatMessageBranchPage, ChatMessageBranchNext } from "@theokit/ui";

export const Branching = () => (
  <ChatMessageBranch>
    <ChatMessageBranchContent>
      <ChatMessageResponse text="Version **1**: I'll use React state." />
      <ChatMessageResponse text="Version **2**: I'll use Zustand for global state." />
      <ChatMessageResponse text="Version **3**: server components + React Query." />
    </ChatMessageBranchContent>
    <ChatMessageBranchSelector>
      <ChatMessageBranchPrevious />
      <ChatMessageBranchPage />
      <ChatMessageBranchNext />
    </ChatMessageBranchSelector>
  </ChatMessageBranch>
);
