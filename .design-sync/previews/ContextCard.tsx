import { BookOpen, Wrench } from "lucide-react";
import { ContextCard } from "@theokit/ui";



export const Default = () => (
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
