import type { Story } from "@ladle/react";
import { BookOpen, Wrench } from "lucide-react";
import { ContextCard } from "./context-card.js";

export default { title: "Primitives / Files / ContextCard" };

export const Default: Story = () => (
  <div className="grid max-w-sm gap-3">
    <ContextCard
      title="Contexto"
      description="Acompanhe ferramentas e arquivos referenciados nesta tarefa."
    />
    <ContextCard
      icon={Wrench}
      title="Ferramentas utilizadas"
      description="bash · read_file · edit_file · search"
    />
    <ContextCard
      icon={BookOpen}
      title="Documentação"
      description="Project rules and conventions loaded into context."
    />
  </div>
);
