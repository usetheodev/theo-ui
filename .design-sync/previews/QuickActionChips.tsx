import { BookOpen, Code2, Palette, Sparkles, User } from "lucide-react";
import { QuickActionChips } from "@theokit/ui";



export const Default = () => (
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
