import type { Story } from "@ladle/react";
import { ExternalLink, FileSpreadsheet, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { ChatComposer } from "../components/composites/chat-composer/chat-composer.js";
import { TaskHeader } from "../components/composites/task-header/task-header.js";
import { ArtifactPreview } from "../components/primitives/artifact-preview/artifact-preview.js";
import { Badge } from "../components/primitives/badge/badge.js";
import { Button } from "../components/primitives/button/button.js";
import { ChatMessage } from "../components/primitives/chat-message/chat-message.js";
import { ChatThread } from "../components/primitives/chat-thread/chat-thread.js";
import { CreatedFilesCard } from "../components/primitives/created-files-card/created-files-card.js";
import { ProgressChecklist } from "../components/primitives/progress-checklist/progress-checklist.js";
import { Sidebar } from "../components/primitives/sidebar/sidebar.js";
import { TopNav } from "../components/primitives/topnav/topnav.js";

export default { title: "Screens / Task Completed" };

export const ExpenseReport: Story = () => {
  const [mode, setMode] = useState("infra");
  const [prompt, setPrompt] = useState("");
  return (
    <div className="-m-12 flex h-[820px] overflow-hidden bg-background">
      <Sidebar className="h-full">
        <Sidebar.Header>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground">
            T
          </span>
          <span className="font-display text-title-md">theo</span>
        </Sidebar.Header>
        <Sidebar.Section>
          <Sidebar.Item icon={Sparkles}>+ Nova tarefa</Sidebar.Item>
          <Sidebar.Item icon={Search}>Procurar</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section title="Recentes">
          <Sidebar.Item active>Expense report from receipts</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Footer>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-label-caps">
              AA
            </span>
            <span className="font-medium text-body-sm">Alfredo Araujo</span>
          </div>
        </Sidebar.Footer>
      </Sidebar>

      <main className="flex flex-1 flex-col">
        <TopNav>
          <TopNav.Left />
          <TopNav.Center>
            <TopNav.ModeSwitcher
              value={mode}
              onChange={setMode}
              options={[
                { value: "chat", label: "Chat" },
                { value: "infra", label: "Infra" },
                { value: "code", label: "Code" },
              ]}
            />
          </TopNav.Center>
          <TopNav.Right />
        </TopNav>

        <div className="grid flex-1 grid-cols-2 overflow-hidden">
          {/* Left: conversation */}
          <section className="flex flex-col gap-4 overflow-y-auto px-6 py-6">
            <TaskHeader title="Create expense report from receipts" status="completed" />
            <ChatThread>
              <ChatMessage
                message={{
                  id: "a1",
                  role: "assistant",
                  model: "Sonnet 4.6",
                  content: (
                    <div className="grid gap-3">
                      <p>Done. Here's your expense report:</p>
                      <a
                        // biome-ignore lint/a11y/useValidAnchor: mockup link
                        href="#"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        View your expense report <ExternalLink className="size-3" />
                      </a>
                      <div>
                        <p className="font-semibold">What's in it:</p>
                        <p className="text-body-sm text-muted-foreground">
                          84 line items across two sheets. The <strong>Expense Report</strong> sheet
                          has every receipt sorted by date, vendor, category, amount, currency, and
                          notes. The <strong>Currency Summary</strong> sheet has totals by currency.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">
                          Rows flagged with <Badge variant="warning">VERIFY</Badge>:
                        </p>
                        <ul className="ml-4 list-disc text-body-sm">
                          <li>Taxi receipt · vendor name unclear</li>
                          <li>Two JPEG images · amounts too blurry</li>
                          <li>Westin Thailand · THB seems unusual</li>
                          <li>Beijing Marriott · stay may have been October</li>
                          <li>Ping Pong Gintoneria · total may be cut off</li>
                        </ul>
                      </div>
                    </div>
                  ),
                }}
              />
            </ChatThread>
            <CreatedFilesCard
              files={[
                {
                  id: "x1",
                  name: "expense-report.xlsx",
                  icon: FileSpreadsheet,
                  size: "42 KB",
                  destination: "Google Drive · /Reports",
                  href: "#",
                },
              ]}
            />
            <ChatComposer mode="infra" value={prompt} onValueChange={setPrompt} />
          </section>

          {/* Right: artifact preview */}
          <section className="bg-muted/20 p-4">
            <ArtifactPreview
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
                <header className="mb-2 grid grid-cols-5 gap-3 border-border/40 border-b pb-1 font-bold text-foreground">
                  <span>Date</span>
                  <span>Vendor</span>
                  <span>Category</span>
                  <span>Amount</span>
                  <span>Currency</span>
                </header>
                {[
                  ["07-Oct-16", "Westin", "Hotel", "270.00", "USD"],
                  ["16-Oct-16", "Taxi Receipt", "Travel", "10.00", "USD", true],
                  ["16-Dec-14", "Ping Pong", "Meal", "185.00", "USD"],
                  ["14-Dec-14", "Two JPEG", "Unknown", "40.00", "USD", true],
                  ["13-Sep-13", "Gintoneria", "Meal", "67.00", "USD"],
                ].map((row, idx) => (
                  <div
                    key={`${row[0]}-${idx}`}
                    className={`grid grid-cols-5 gap-3 py-1 ${row[5] ? "bg-warning/10" : ""}`}
                  >
                    <span>{row[0]}</span>
                    <span>{row[1]}</span>
                    <span>{row[2]}</span>
                    <span>{row[3]}</span>
                    <span>{row[4]}</span>
                  </div>
                ))}
              </div>
            </ArtifactPreview>
          </section>
        </div>
      </main>

      <aside className="grid w-72 gap-4 border-border/40 border-l bg-card p-4">
        <ProgressChecklist
          title="Progresso"
          steps={[
            { id: "1", label: "Scan receipts", status: "done" },
            { id: "2", label: "Extract line items", status: "done" },
            { id: "3", label: "Detect uncertainties", status: "done" },
            { id: "4", label: "Upload to Drive", status: "done" },
          ]}
        />
      </aside>
    </div>
  );
};
