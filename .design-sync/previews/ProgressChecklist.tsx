import { ProgressChecklist } from "@theokit/ui";



export const Default = () => (
  <ProgressChecklist
    className="max-w-sm"
    title="Progresso"
    steps={[
      { id: "1", label: "Criar subpastas na pasta capturas", status: "done" },
      {
        id: "2",
        label: "Mover imagens para subpastas corretas",
        status: "running",
        progress: 0.4,
      },
      { id: "3", label: "Verificar resultado final", status: "pending" },
      { id: "4", label: "Limpeza opcional", status: "skipped" },
    ]}
  />
);
