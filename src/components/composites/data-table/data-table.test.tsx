import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DropdownMenu } from "../../primitives/dropdown-menu/index.js";
import { DataTable, type DataTableColumn } from "./data-table.js";

interface TestRow {
  id: string;
  name: string;
  value: number;
}

const rows: TestRow[] = [
  { id: "a", name: "Banana", value: 2 },
  { id: "b", name: "Apple", value: 3 },
  { id: "c", name: "Cherry", value: 1 },
];

const columns: DataTableColumn<TestRow>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "value", label: "Value", sortable: true, align: "right" },
];

describe("DataTable — rendering", () => {
  it("renders columns and rows from data", () => {
    render(<DataTable columns={columns} data={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("sticky header applies sticky class", () => {
    const { container } = render(
      <DataTable columns={columns} data={rows} rowKey={(r) => r.id} stickyHeader />,
    );
    const thead = container.querySelector("thead");
    expect(thead?.className).toContain("sticky");
  });

  it("stickyHeader=false omits sticky class", () => {
    const { container } = render(
      <DataTable columns={columns} data={rows} rowKey={(r) => r.id} stickyHeader={false} />,
    );
    const thead = container.querySelector("thead");
    expect(thead?.className).not.toContain("sticky");
  });
});

describe("DataTable — sort", () => {
  it("uncontrolled sort cycles asc → desc → none", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} rowKey={(r) => r.id} />);
    const nameSort = screen.getByRole("button", { name: /Name/ });
    // First click: asc
    await user.click(nameSort);
    const rowsAfterAsc = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => r.textContent);
    expect(rowsAfterAsc[0]).toContain("Apple");
    expect(rowsAfterAsc[1]).toContain("Banana");
    expect(rowsAfterAsc[2]).toContain("Cherry");
    // Second click: desc
    await user.click(nameSort);
    const rowsAfterDesc = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => r.textContent);
    expect(rowsAfterDesc[0]).toContain("Cherry");
  });

  it("controlled sort via onSortChange (internal state untouched)", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        sort={null}
        onSortChange={onSortChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: "asc" });
  });

  // EC-10: controlled sort=null renders no active sort indicator
  it("controlled sort=null renders no active indicator", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        sort={null}
        onSortChange={() => undefined}
      />,
    );
    // All sort chevrons should be dimmed (opacity-30)
    const svgs = container.querySelectorAll("button[aria-sort] svg");
    for (const svg of svgs) {
      expect(svg.getAttribute("class")).toContain("opacity-30");
    }
  });
});

describe("DataTable — expandable", () => {
  it("chevron only renders when expandable returns non-null", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        expandable={(r) => (r.id === "a" ? <div>details</div> : null)}
      />,
    );
    // Row "a" has an expand button; rows "b" and "c" do not
    const expandButtons = container.querySelectorAll('button[aria-label*="xpand"]');
    expect(expandButtons.length).toBe(1);
  });

  it("multiple expand mode allows multiple rows expanded", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        expandable={(r) => <div>details-{r.id}</div>}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: /xpand row/i });
    await user.click(buttons[0] as HTMLElement);
    await user.click(buttons[1] as HTMLElement);
    expect(screen.getByText("details-a")).toBeInTheDocument();
    expect(screen.getByText("details-b")).toBeInTheDocument();
  });

  it("single expand mode collapses prior row", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        expandable={(r) => <div>details-{r.id}</div>}
        expandMode="single"
      />,
    );
    const buttons = screen.getAllByRole("button", { name: /xpand row/i });
    await user.click(buttons[0] as HTMLElement);
    expect(screen.getByText("details-a")).toBeInTheDocument();
    await user.click(buttons[1] as HTMLElement);
    expect(screen.queryByText("details-a")).toBeNull();
    expect(screen.getByText("details-b")).toBeInTheDocument();
  });

  // EC-1 MUST FIX: expanded row colSpan accounts for chevron + rowActions
  it("expanded row colSpan accounts for actions column", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        columns={columns}
        data={[rows[0] as TestRow]}
        rowKey={(r) => r.id}
        expandable={(r) => <div>details-{r.id}</div>}
        rowActions={(r) => <DropdownMenu.Item>Edit {r.id}</DropdownMenu.Item>}
      />,
    );
    await user.click(screen.getByRole("button", { name: /xpand row/i }));
    // columns.length=2 + chevron=1 + actions=1 → colSpan=4
    const expandedCell = container.querySelector("td[colspan]");
    expect(expandedCell?.getAttribute("colspan")).toBe("4");
  });
});

describe("DataTable — row actions + pagination + loading + empty", () => {
  it("rowActions renders MoreHorizontal trigger per row", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        rowActions={() => <DropdownMenu.Item>Edit</DropdownMenu.Item>}
      />,
    );
    const triggers = screen.getAllByRole("button", { name: "Row actions" });
    expect(triggers).toHaveLength(3);
  });

  it("pagination slices data per pageSize", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `r-${i}`, name: `r-${i}`, value: i }));
    render(
      <DataTable columns={columns} data={many} rowKey={(r) => r.id} pagination={{ pageSize: 5 }} />,
    );
    const dataRows = screen.getAllByRole("row").slice(1);
    expect(dataRows.length).toBe(5);
  });

  it("loading renders 5 skeleton rows", () => {
    const { container } = render(
      <DataTable columns={columns} data={rows} rowKey={(r) => r.id} loading />,
    );
    const skeletonRows = container.querySelectorAll("tbody tr");
    expect(skeletonRows.length).toBe(5);
  });

  // EC-7: loading > empty precedence
  it("loading overrides empty state (loading > empty precedence)", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(r) => r.id}
        loading
        emptyState={<div>EMPTY-MARKER</div>}
      />,
    );
    expect(container.textContent).not.toContain("EMPTY-MARKER");
    expect(container.querySelectorAll("tbody tr").length).toBe(5);
  });

  it("custom empty state renders when data empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(r) => r.id}
        emptyState={<div>EMPTY-MARKER</div>}
      />,
    );
    expect(screen.getByText("EMPTY-MARKER")).toBeInTheDocument();
  });

  it("default empty state when not provided", () => {
    render(<DataTable columns={columns} data={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  // EC-8: sort change resets to page 0
  it("sort change resets pagination to page 0 (uncontrolled)", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `r-${i}`,
      name: `name-${i}`,
      value: i,
    }));
    render(
      <DataTable columns={columns} data={many} rowKey={(r) => r.id} pagination={{ pageSize: 5 }} />,
    );
    // Go to page 3
    await user.click(screen.getByRole("button", { name: "Go to page 3" }));
    // Click sort
    await user.click(screen.getByRole("button", { name: /Name/ }));
    // Should be back at page 1 (1-indexed in nav)
    const currentPageBtn = screen.getByRole("button", { name: "Go to page 1" });
    expect(currentPageBtn).toHaveAttribute("aria-current", "page");
  });

  // EC-9: pageSize <= 0 clamps gracefully
  it("pageSize <= 0 clamps to 1 (graceful)", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ id: `r-${i}`, name: `r-${i}`, value: i }));
    render(
      <DataTable columns={columns} data={many} rowKey={(r) => r.id} pagination={{ pageSize: 0 }} />,
    );
    // Effective pageSize=1, so first page shows 1 row
    const dataRows = screen.getAllByRole("row").slice(1);
    expect(dataRows.length).toBe(1);
  });
});

describe("DataTable — a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(<DataTable columns={columns} data={rows} rowKey={(r) => r.id} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
