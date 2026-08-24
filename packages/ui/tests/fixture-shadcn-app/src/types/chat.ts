import type { ReactNode } from "react";

export type MessageRole = "user" | "assistant" | "system";

export interface Attachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string | ReactNode;
  timestamp?: string;
  /**
   * Model that produced this message (assistant role only).
   * e.g. "Opus 4.6", "Sonnet 4.6", "GPT-5.4".
   */
  model?: string;
  attachments?: Attachment[];
}
