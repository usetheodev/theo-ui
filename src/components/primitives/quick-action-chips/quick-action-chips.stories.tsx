import type { Story } from "@ladle/react";
import { BookOpen, Code2, Palette, Sparkles, User } from "lucide-react";
import { QuickActionChips } from "./quick-action-chips.js";

export default { title: "Primitives / Chat / QuickActionChips" };

export const Default: Story = () => (
  <QuickActionChips
    actions={[
      { id: "write", label: "Escrever", icon: BookOpen },
      { id: "learn", label: "Aprender", icon: BookOpen },
      { id: "code", label: "Código", icon: Code2 },
      { id: "design", label: "Design", icon: Palette },
      { id: "personal", label: "Assuntos pessoais", icon: User },
      { id: "auto", label: "Escolha do Theo", icon: Sparkles, primary: true },
    ]}
  />
);
