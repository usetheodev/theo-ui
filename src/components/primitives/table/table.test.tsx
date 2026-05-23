import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Table } from "./table.js";

describe("Table — composition", () => {
  it("renders header and body rows", () => {
    render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>2026-05-23</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("2026-05-23")).toBeInTheDocument();
  });

  it("empty body does not crash", () => {
    expect(() =>
      render(
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Col</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body />
        </Table>,
      ),
    ).not.toThrow();
  });
});

describe("Table — cell variants", () => {
  it("numeric cell has tabular-nums + font-mono", () => {
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell numeric data-testid="c">
              42
            </Table.Cell>
          </tr>
        </tbody>
      </table>,
    );
    const cell = screen.getByTestId("c");
    expect(cell.className).toContain("tabular-nums");
    expect(cell.className).toContain("font-mono");
  });

  it("align=right applies text-right", () => {
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell align="right" data-testid="c">
              42
            </Table.Cell>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByTestId("c").className).toContain("text-right");
  });

  it("density=compact reduces vertical padding", () => {
    render(
      <Table density="compact">
        <Table.Body>
          <Table.Row>
            <Table.Cell data-testid="c">x</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(screen.getByTestId("c").className).toContain("py-1.5");
  });
});

describe("Table — sortable header", () => {
  it("fires onSort when sortable header clicked", () => {
    const onSort = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <Table.HeaderCell onSort={onSort}>Date</Table.HeaderCell>
          </tr>
        </thead>
      </table>,
    );
    fireEvent.click(screen.getByRole("button", { name: /date/i }));
    expect(onSort).toHaveBeenCalled();
  });

  it("sortDirection swaps which icon is active (asc/desc)", () => {
    const onSort = vi.fn();
    const { container, rerender } = render(
      <table>
        <thead>
          <tr>
            <Table.HeaderCell onSort={onSort} sortDirection="asc">
              Date
            </Table.HeaderCell>
          </tr>
        </thead>
      </table>,
    );
    let svgs = container.querySelectorAll("svg");
    expect(svgs[0]?.getAttribute("class")).toContain("opacity-100");
    expect(svgs[1]?.getAttribute("class")).toContain("opacity-30");

    rerender(
      <table>
        <thead>
          <tr>
            <Table.HeaderCell onSort={onSort} sortDirection="desc">
              Date
            </Table.HeaderCell>
          </tr>
        </thead>
      </table>,
    );
    svgs = container.querySelectorAll("svg");
    expect(svgs[0]?.getAttribute("class")).toContain("opacity-30");
    expect(svgs[1]?.getAttribute("class")).toContain("opacity-100");
  });

  // EC-4: sortDirection without onSort is ignored
  it("sortDirection without onSort renders static th (no button, no chevrons)", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <Table.HeaderCell sortDirection="asc">Date</Table.HeaderCell>
          </tr>
        </thead>
      </table>,
    );
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  // EC-5: sortDirection="none" + onSort renders both icons dimmed
  it("sortDirection='none' with onSort renders both chevrons dimmed", () => {
    const onSort = vi.fn();
    const { container } = render(
      <table>
        <thead>
          <tr>
            <Table.HeaderCell onSort={onSort} sortDirection="none">
              Date
            </Table.HeaderCell>
          </tr>
        </thead>
      </table>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2);
    expect(svgs[0]?.getAttribute("class")).toContain("opacity-30");
    expect(svgs[1]?.getAttribute("class")).toContain("opacity-30");
  });
});

describe("Table — a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell align="right">Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>2026-05-23</Table.Cell>
            <Table.Cell numeric align="right">
              42
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
