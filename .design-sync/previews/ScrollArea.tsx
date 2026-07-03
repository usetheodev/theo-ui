import { ScrollArea } from "@theokit/ui";



const longText = Array.from({ length: 50 }, (_, i) => ({
  id: `line-${i + 1}`,
  text: `Linha ${i + 1} · Lorem ipsum dolor sit amet.`,
}));

const cards = Array.from({ length: 20 }, (_, i) => ({
  id: `card-${i + 1}`,
  label: `card #${i + 1}`,
  name: `acme-${i + 1}`,
}));

const cols = Array.from({ length: 12 }, (_, i) => ({
  id: `col-${i + 1}`,
  label: `Column ${i + 1}`,
}));
const rows = Array.from({ length: 30 }, (_, r) => ({
  id: `row-${r + 1}`,
  cells: cols.map((c, i) => ({ id: `${c.id}-r${r + 1}`, label: `R${r + 1}C${i + 1}` })),
}));

const thread = Array.from({ length: 12 }, (_, i) => ({
  id: `msg-${i + 1}`,
  role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
  text:
    i % 2 === 0
      ? `Pergunta ${i + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
      : `Resposta ${i + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
}));

export const Vertical = () => (
  <ScrollArea className="h-72 w-80 rounded-xl border bg-card p-4">
    <ul className="grid gap-1.5 text-body-sm">
      {longText.map((line) => (
        <li key={line.id} className="border-border/30 border-b py-1">
          {line.text}
        </li>
      ))}
    </ul>
  </ScrollArea>
);

export const Horizontal = () => (
  <ScrollArea orientation="horizontal" className="w-[600px] rounded-xl border bg-card p-4">
    <div className="flex gap-3 pb-1">
      {cards.map((c) => (
        <div
          key={c.id}
          className="flex h-32 w-48 shrink-0 flex-col justify-end rounded-lg border border-border/40 bg-muted/40 p-3"
        >
          <span className="font-mono text-label-caps text-muted-foreground uppercase">
            {c.label}
          </span>
          <span className="font-display text-title-md">{c.name}</span>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export const Both = () => (
  <ScrollArea orientation="both" className="h-72 w-[480px] rounded-xl border bg-card">
    <table className="border-collapse text-body-sm">
      <thead>
        <tr className="border-border/40 border-b bg-muted/30">
          {cols.map((c) => (
            <th
              key={c.id}
              className="whitespace-nowrap px-4 py-2 text-left font-mono text-label-caps"
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-border/30 border-b">
            {row.cells.map((cell) => (
              <td key={cell.id} className="whitespace-nowrap px-4 py-2 font-mono text-code-sm">
                {cell.label}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </ScrollArea>
);

export const ThinVsRegular = () => (
  <div className="grid grid-cols-2 gap-6">
    <div className="grid gap-2">
      <span className="font-mono text-label-caps text-muted-foreground uppercase">
        size=thin (default)
      </span>
      <ScrollArea size="thin" className="h-72 w-80 rounded-xl border bg-card p-4">
        <ul className="grid gap-1.5 text-body-sm">
          {longText.map((line) => (
            <li key={line.id} className="border-border/30 border-b py-1">
              {line.text}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
    <div className="grid gap-2">
      <span className="font-mono text-label-caps text-muted-foreground uppercase">
        size=regular
      </span>
      <ScrollArea size="regular" className="h-72 w-80 rounded-xl border bg-card p-4">
        <ul className="grid gap-1.5 text-body-sm">
          {longText.map((line) => (
            <li key={line.id} className="border-border/30 border-b py-1">
              {line.text}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  </div>
);

export const HoverVsAlways = () => (
  <div className="grid grid-cols-2 gap-6">
    <div className="grid gap-2">
      <span className="font-mono text-label-caps text-muted-foreground uppercase">
        type=hover (default — fades in)
      </span>
      <ScrollArea type="hover" className="h-72 w-80 rounded-xl border bg-card p-4">
        <ul className="grid gap-1.5 text-body-sm">
          {longText.slice(0, 30).map((line) => (
            <li key={line.id} className="border-border/30 border-b py-1">
              {line.text}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
    <div className="grid gap-2">
      <span className="font-mono text-label-caps text-muted-foreground uppercase">
        type=always (always visible)
      </span>
      <ScrollArea type="always" className="h-72 w-80 rounded-xl border bg-card p-4">
        <ul className="grid gap-1.5 text-body-sm">
          {longText.slice(0, 30).map((line) => (
            <li key={line.id} className="border-border/30 border-b py-1">
              {line.text}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  </div>
);

export const InsideChatThread = () => (
  <ScrollArea className="h-96 w-[28rem] rounded-2xl border bg-card">
    <div className="grid gap-4 p-5">
      {thread.map((msg) => (
        <article
          key={msg.id}
          className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
        >
          <div
            className={
              msg.role === "user"
                ? "max-w-[70%] rounded-2xl rounded-tr-md border border-border/40 bg-secondary px-4 py-2 text-body-sm"
                : "max-w-[70%] rounded-2xl rounded-tl-md border border-border/40 border-l-2 border-l-primary bg-card px-4 py-2 text-body-sm shadow-sm"
            }
          >
            {msg.text}
          </div>
        </article>
      ))}
    </div>
  </ScrollArea>
);
