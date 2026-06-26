import { ArtifactPreview, Button } from "@theokit/ui";

export const Spreadsheet = () => (
  <ArtifactPreview
    className="h-[420px] w-full max-w-3xl"
    title="expense-report · XLSX"
    source="Google Drive · synced 2m ago"
    onRefresh={() => undefined}
    onMaximize={() => undefined}
    onClose={() => undefined}
    tabs={
      <>
        <Button size="sm" variant="ghost">
          Expense Report
        </Button>
        <Button size="sm" variant="ghost">
          Currency Summary
        </Button>
      </>
    }
  >
    <div className="p-4 font-mono text-code-sm">
      <header className="mb-2 grid grid-cols-5 gap-3 border-border/40 border-b pb-1 font-bold">
        <span>Date</span>
        <span>Vendor</span>
        <span>Category</span>
        <span>Amount</span>
        <span>Currency</span>
      </header>
      {[
        ["07-Oct-16", "Westin", "Hotel", "270.00", "USD"],
        ["16-Oct-16", "Taxi Receipt", "Travel", "10.00", "USD"],
        ["16-Dec-14", "Ping Pong", "Meal", "185.00", "USD"],
      ].map((row) => (
        <div
          key={`${row[0]}-${row[1]}`}
          className="grid grid-cols-5 gap-3 border-border/20 border-b py-1"
        >
          {row.map((cell, i) => (
            <span key={`${row[0]}-${i}`}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  </ArtifactPreview>
);
